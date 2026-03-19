import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

export type BroadcastItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  startsAt?: string | null;
  active?: boolean;
  audience?: 'all' | 'email' | 'women' | 'men';
  targetEmail?: string;
  actionTab?: string;
  actionParams?: Record<string, any>;
  linkUrl?: string;
  sendPush?: boolean;
  pushDeliveredAt?: string | null;
  source?: 'lifetime_offer' | 'custom';
};

function mapRowToBroadcast(row: any): BroadcastItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    startsAt: row.starts_at,
    active: row.active,
    audience: row.audience || undefined,
    targetEmail: row.target_email || undefined,
    actionTab: row.action_tab || undefined,
    actionParams: row.action_params || undefined,
    linkUrl: row.link_url || undefined,
    sendPush: row.send_push ?? undefined,
    pushDeliveredAt: row.push_delivered_at || null,
    source: row.source || 'custom',
  };
}

async function readLocal() {
  return readJsonFile<BroadcastItem[]>('broadcasts.json', []);
}

async function writeLocal(items: BroadcastItem[]) {
  await writeJsonFile('broadcasts.json', items);
}

async function ensureRemoteSeeded() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('app_broadcasts')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  if ((count || 0) > 0) return;

  const localItems = await readLocal();
  if (localItems.length === 0) return;

  const { error: insertError } = await supabase
    .from('app_broadcasts')
    .insert(localItems.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      created_at: item.createdAt,
      starts_at: item.startsAt || null,
      active: item.active !== false,
      audience: item.audience || null,
      target_email: item.targetEmail || null,
      action_tab: item.actionTab || null,
      action_params: item.actionParams || null,
      link_url: item.linkUrl || null,
      send_push: item.sendPush !== false,
      push_delivered_at: item.pushDeliveredAt || null,
      source: item.source || 'custom',
    })));

  if (insertError) throw insertError;
}

export async function readBroadcasts(): Promise<BroadcastItem[]> {
  if (!isSupabaseAdminConfigured) return readLocal();

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('app_broadcasts')
    .select('id, title, body, created_at, starts_at, active, audience, target_email, action_tab, action_params, link_url, send_push, push_delivered_at, source')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data.map(mapRowToBroadcast) : [];
}

export async function addBroadcast(item: BroadcastItem) {
  if (!isSupabaseAdminConfigured) {
    const items = await readLocal();
    items.unshift(item);
    await writeLocal(items);
    return;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('app_broadcasts')
    .insert({
      id: item.id,
      title: item.title,
      body: item.body,
      created_at: item.createdAt,
      starts_at: item.startsAt || null,
      active: item.active !== false,
      audience: item.audience || null,
      target_email: item.targetEmail || null,
      action_tab: item.actionTab || null,
      action_params: item.actionParams || null,
      link_url: item.linkUrl || null,
      send_push: item.sendPush !== false,
      push_delivered_at: item.pushDeliveredAt || null,
      source: item.source || 'custom',
    });

  if (error) throw error;
}

export async function upsertBroadcast(item: BroadcastItem) {
  if (!isSupabaseAdminConfigured) {
    const items = await readLocal();
    const next = [item, ...items.filter((entry) => entry.id !== item.id)];
    await writeLocal(next);
    return;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('app_broadcasts')
    .upsert({
      id: item.id,
      title: item.title,
      body: item.body,
      created_at: item.createdAt,
      starts_at: item.startsAt || null,
      active: item.active !== false,
      audience: item.audience || null,
      target_email: item.targetEmail || null,
      action_tab: item.actionTab || null,
      action_params: item.actionParams || null,
      link_url: item.linkUrl || null,
      send_push: item.sendPush !== false,
      push_delivered_at: item.pushDeliveredAt || null,
      source: item.source || 'custom',
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function removeBroadcast(id: string) {
  if (!isSupabaseAdminConfigured) {
    const items = await readLocal();
    await writeLocal(items.filter((entry) => entry.id !== id));
    return;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('app_broadcasts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getBroadcastById(id: string) {
  if (!isSupabaseAdminConfigured) {
    const items = await readBroadcasts();
    return items.find((entry) => entry.id === id) || null;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('app_broadcasts')
    .select('id, title, body, created_at, starts_at, active, audience, target_email, action_tab, action_params, link_url, send_push, push_delivered_at, source')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToBroadcast(data) : null;
}

export async function updateBroadcast(id: string, patch: Partial<BroadcastItem>) {
  if (!isSupabaseAdminConfigured) {
    const items = await readLocal();
    const existing = items.find((entry) => entry.id === id);
    if (!existing) return null;
    const nextItem: BroadcastItem = { ...existing, ...patch, id: existing.id };
    const next = [nextItem, ...items.filter((entry) => entry.id !== id)];
    await writeLocal(next);
    return nextItem;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const updatePayload: Record<string, any> = {};
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.body !== undefined) updatePayload.body = patch.body;
  if (patch.createdAt !== undefined) updatePayload.created_at = patch.createdAt;
  if (patch.startsAt !== undefined) updatePayload.starts_at = patch.startsAt || null;
  if (patch.active !== undefined) updatePayload.active = patch.active;
  if (patch.audience !== undefined) updatePayload.audience = patch.audience || null;
  if (patch.targetEmail !== undefined) updatePayload.target_email = patch.targetEmail || null;
  if (patch.actionTab !== undefined) updatePayload.action_tab = patch.actionTab || null;
  if (patch.actionParams !== undefined) updatePayload.action_params = patch.actionParams || null;
  if (patch.linkUrl !== undefined) updatePayload.link_url = patch.linkUrl || null;
  if (patch.sendPush !== undefined) updatePayload.send_push = patch.sendPush;
  if (patch.pushDeliveredAt !== undefined) updatePayload.push_delivered_at = patch.pushDeliveredAt || null;
  if (patch.source !== undefined) updatePayload.source = patch.source;

  const { data, error } = await supabase
    .from('app_broadcasts')
    .update(updatePayload)
    .eq('id', id)
    .select('id, title, body, created_at, starts_at, active, audience, target_email, action_tab, action_params, link_url, send_push, push_delivered_at, source')
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToBroadcast(data) : null;
}

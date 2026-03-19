import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

export type PromoAudience = 'all' | 'email' | 'women' | 'men';

export interface PromoAccessCampaign {
  id: string;
  title: string;
  durationDays: number;
  audience: PromoAudience;
  targetEmail?: string;
  grantedByEmail?: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const PROMO_ACCESS_FILE = 'promo-access-campaigns.json';

function mapRowToCampaign(row: any): PromoAccessCampaign {
  return {
    id: row.id,
    title: row.title,
    durationDays: row.duration_days,
    audience: row.audience,
    targetEmail: row.target_email || undefined,
    grantedByEmail: row.granted_by_email || undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readLocal() {
  return readJsonFile<PromoAccessCampaign[]>(PROMO_ACCESS_FILE, []);
}

async function writeLocal(items: PromoAccessCampaign[]) {
  await writeJsonFile(PROMO_ACCESS_FILE, items);
}

async function ensureRemoteSeeded() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('promo_access_campaigns')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  if ((count || 0) > 0) return;

  const localItems = await readLocal();
  if (localItems.length === 0) return;

  const { error: insertError } = await supabase
    .from('promo_access_campaigns')
    .insert(localItems.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      duration_days: campaign.durationDays,
      audience: campaign.audience,
      target_email: campaign.targetEmail || null,
      granted_by_email: campaign.grantedByEmail || null,
      starts_at: campaign.startsAt,
      ends_at: campaign.endsAt,
      active: campaign.active,
      created_at: campaign.createdAt,
      updated_at: campaign.updatedAt,
    })));

  if (insertError) throw insertError;
}

export async function listPromoAccessCampaigns() {
  if (!isSupabaseAdminConfigured) return readLocal();

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('promo_access_campaigns')
    .select('id, title, duration_days, audience, target_email, granted_by_email, starts_at, ends_at, active, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data.map(mapRowToCampaign) : [];
}

export async function upsertPromoAccessCampaign(campaign: PromoAccessCampaign) {
  if (!isSupabaseAdminConfigured) {
    const items = await listPromoAccessCampaigns();
    const next = [campaign, ...items.filter((item) => item.id !== campaign.id)];
    await writeLocal(next);
    return campaign;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('promo_access_campaigns')
    .upsert({
      id: campaign.id,
      title: campaign.title,
      duration_days: campaign.durationDays,
      audience: campaign.audience,
      target_email: campaign.targetEmail || null,
      granted_by_email: campaign.grantedByEmail || null,
      starts_at: campaign.startsAt,
      ends_at: campaign.endsAt,
      active: campaign.active,
      created_at: campaign.createdAt,
      updated_at: campaign.updatedAt,
    }, { onConflict: 'id' });

  if (error) throw error;
  return campaign;
}

export async function getPromoCampaignById(id: string) {
  if (!isSupabaseAdminConfigured) {
    const items = await listPromoAccessCampaigns();
    return items.find((item) => item.id === id) || null;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('promo_access_campaigns')
    .select('id, title, duration_days, audience, target_email, granted_by_email, starts_at, ends_at, active, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToCampaign(data) : null;
}

export async function updatePromoAccessCampaign(id: string, patch: Partial<PromoAccessCampaign>) {
  if (!isSupabaseAdminConfigured) {
    const items = await listPromoAccessCampaigns();
    const existing = items.find((item) => item.id === id);
    if (!existing) return null;
    const nextCampaign: PromoAccessCampaign = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    await writeLocal([nextCampaign, ...items.filter((item) => item.id !== id)]);
    return nextCampaign;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.durationDays !== undefined) updatePayload.duration_days = patch.durationDays;
  if (patch.audience !== undefined) updatePayload.audience = patch.audience;
  if (patch.targetEmail !== undefined) updatePayload.target_email = patch.targetEmail || null;
  if (patch.grantedByEmail !== undefined) updatePayload.granted_by_email = patch.grantedByEmail || null;
  if (patch.startsAt !== undefined) updatePayload.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) updatePayload.ends_at = patch.endsAt;
  if (patch.active !== undefined) updatePayload.active = patch.active;
  if (patch.createdAt !== undefined) updatePayload.created_at = patch.createdAt;

  const { data, error } = await supabase
    .from('promo_access_campaigns')
    .update(updatePayload)
    .eq('id', id)
    .select('id, title, duration_days, audience, target_email, granted_by_email, starts_at, ends_at, active, created_at, updated_at')
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToCampaign(data) : null;
}

export async function removePromoAccessCampaign(id: string) {
  if (!isSupabaseAdminConfigured) {
    const items = await listPromoAccessCampaigns();
    const existing = items.find((item) => item.id === id);
    if (!existing) return null;
    await writeLocal(items.filter((item) => item.id !== id));
    return existing;
  }

  await ensureRemoteSeeded();
  const existing = await getPromoCampaignById(id);
  if (!existing) return null;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('promo_access_campaigns')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return existing;
}

export async function getApplicablePromoAccess(params: {
  email?: string | null;
  sex?: string | null;
  now?: Date;
}) {
  const email = String(params.email || '').trim().toLowerCase();
  const sex = String(params.sex || '').trim().toLowerCase();
  const now = params.now || new Date();
  const items = await listPromoAccessCampaigns();

  return items.find((item) => {
    if (!item.active) return false;
    const startsAt = new Date(item.startsAt).getTime();
    const endsAt = new Date(item.endsAt).getTime();
    const nowTime = now.getTime();
    if (Number.isNaN(startsAt) || Number.isNaN(endsAt) || nowTime < startsAt || nowTime > endsAt) return false;

    if (item.audience === 'all') return true;
    if (item.audience === 'email') return email && item.targetEmail?.toLowerCase() === email;
    if (item.audience === 'women') return sex === 'feminino' || sex === 'mulher';
    if (item.audience === 'men') return sex === 'masculino' || sex === 'homem';
    return false;
  }) || null;
}

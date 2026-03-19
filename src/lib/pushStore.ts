import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

export type PushSubRecord = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  email?: string;
  name?: string;
  birthdate?: string;
  sex?: string;
  reminders?: Record<string, any>;
  capsules?: Array<{ id: string; title?: string; type?: string; openAt?: string }>;
  updatedAt: string;
};

function mapRowToSub(row: any): PushSubRecord {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
    email: row.email || undefined,
    name: row.name || undefined,
    birthdate: row.birthdate || undefined,
    sex: row.sex || undefined,
    reminders: row.reminders || undefined,
    capsules: row.capsules || undefined,
    updatedAt: row.updated_at,
  };
}

async function readLocalSubs() {
  return readJsonFile<PushSubRecord[]>('push-subs.json', []);
}

async function ensureRemoteSeeded() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint', { count: 'exact', head: true });

  if (error) throw error;
  if ((count || 0) > 0) return;

  const localItems = await readLocalSubs();
  if (localItems.length === 0) return;

  const { error: insertError } = await supabase
    .from('push_subscriptions')
    .insert(localItems.map((item) => ({
      endpoint: item.endpoint,
      p256dh: item.keys.p256dh,
      auth: item.keys.auth,
      email: item.email || null,
      name: item.name || null,
      birthdate: item.birthdate || null,
      sex: item.sex || null,
      reminders: item.reminders || null,
      capsules: item.capsules || null,
      updated_at: item.updatedAt,
    })));

  if (insertError) throw insertError;
}

export async function readSubs(): Promise<PushSubRecord[]> {
  if (!isSupabaseAdminConfigured) {
    return readLocalSubs();
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, email, name, birthdate, sex, reminders, capsules, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data.map(mapRowToSub) : [];
}

export async function upsertSub(input: PushSubRecord) {
  if (!isSupabaseAdminConfigured) {
    const items = await readLocalSubs();
    const next = [input, ...items.filter((entry) => entry.endpoint !== input.endpoint)];
    await writeJsonFile('push-subs.json', next);
    return;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      email: input.email || null,
      name: input.name || null,
      birthdate: input.birthdate || null,
      sex: input.sex || null,
      reminders: input.reminders || null,
      capsules: input.capsules || null,
      updated_at: input.updatedAt,
    }, { onConflict: 'endpoint' });

  if (error) throw error;
}

export async function removeSub(endpoint: string) {
  if (!isSupabaseAdminConfigured) {
    const items = await readLocalSubs();
    await writeJsonFile('push-subs.json', items.filter((entry) => entry.endpoint !== endpoint));
    return;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) throw error;
}

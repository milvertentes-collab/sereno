import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { LifetimeOfferWindow } from './lifetimeOffer';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

const LIFETIME_FILE = 'lifetime-offer.json';

const defaultWindow: LifetimeOfferWindow = {
  enabled: false,
  startsAt: null,
  endsAt: null,
};

function mapRowToWindow(row: any): LifetimeOfferWindow {
  return {
    enabled: Boolean(row.enabled),
    startsAt: row.starts_at || null,
    endsAt: row.ends_at || null,
  };
}

async function getLocalWindow() {
  return readJsonFile<LifetimeOfferWindow>(LIFETIME_FILE, defaultWindow);
}

async function setLocalWindow(next: LifetimeOfferWindow) {
  await writeJsonFile(LIFETIME_FILE, next);
}

async function getRemoteRecord() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('lifetime_offer_windows')
    .select('id, enabled, starts_at, ends_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function getStoredLifetimeOfferWindow(): Promise<LifetimeOfferWindow> {
  if (!isSupabaseAdminConfigured) {
    return getLocalWindow();
  }

  const remote = await getRemoteRecord();
  if (remote) {
    return mapRowToWindow(remote);
  }

  const fallback = await getLocalWindow();
  const created = await updateStoredLifetimeOfferWindow(fallback);
  return created;
}

export async function updateStoredLifetimeOfferWindow(next: LifetimeOfferWindow) {
  if (!isSupabaseAdminConfigured) {
    await setLocalWindow(next);
    return next;
  }

  const supabase = getSupabaseAdmin();
  const existing = await getRemoteRecord();
  const payload = {
    enabled: next.enabled,
    starts_at: next.startsAt || null,
    ends_at: next.endsAt || null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from('lifetime_offer_windows')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('lifetime_offer_windows')
      .insert(payload);
    if (error) throw error;
  }

  return next;
}

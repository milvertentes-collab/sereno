import crypto from 'crypto';
import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

export type AdminSettings = {
  adminEmails: string[];
  passwordHash: string;
  updatedAt: string;
};

type AdminSettingsFile = {
  settings: AdminSettings | null;
};

const ADMIN_SETTINGS_FILE = 'admin-settings.json';

function normalizeEmails(emails: string[]) {
  return Array.from(new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)));
}

function createPasswordHash(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPasswordHash(password: string, storedHash: string) {
  const [scheme, salt, hash] = String(storedHash || '').split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

function buildFallbackSettings() {
  const adminEmails = normalizeEmails(
    String(process.env.NEXT_PUBLIC_SERENO_ADMIN_EMAILS || '')
      .split(',')
      .map((email) => email.trim()),
  );
  const adminPassword = process.env.SERENO_ADMIN_PASSWORD || '';

  return {
    adminEmails,
    passwordHash: createPasswordHash(adminPassword || crypto.randomUUID()),
    updatedAt: new Date().toISOString(),
  } satisfies AdminSettings;
}

async function getLocalAdminSettings() {
  const file = await readJsonFile<AdminSettingsFile>(ADMIN_SETTINGS_FILE, { settings: null });
  if (file.settings) {
    return {
      ...file.settings,
      adminEmails: normalizeEmails(file.settings.adminEmails || []),
    } satisfies AdminSettings;
  }

  const fallback = buildFallbackSettings();
  await writeJsonFile<AdminSettingsFile>(ADMIN_SETTINGS_FILE, { settings: fallback });
  return fallback;
}

async function setLocalAdminSettings(next: AdminSettings) {
  await writeJsonFile<AdminSettingsFile>(ADMIN_SETTINGS_FILE, { settings: next });
}

function mapRowToSettings(row: any): AdminSettings {
  return {
    adminEmails: normalizeEmails(Array.isArray(row.admin_emails) ? row.admin_emails : []),
    passwordHash: row.password_hash,
    updatedAt: row.updated_at,
  };
}

async function getRemoteAdminSettings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('admin_settings')
    .select('id, admin_emails, password_hash, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapRowToSettings(data);

  const local = await readJsonFile<AdminSettingsFile>(ADMIN_SETTINGS_FILE, { settings: null });
  const fallback = local.settings
    ? {
        ...local.settings,
        adminEmails: normalizeEmails(local.settings.adminEmails || []),
      }
    : buildFallbackSettings();
  const { data: inserted, error: insertError } = await supabase
    .from('admin_settings')
    .insert({
      admin_emails: fallback.adminEmails,
      password_hash: fallback.passwordHash,
      updated_at: fallback.updatedAt,
    })
    .select('admin_emails, password_hash, updated_at')
    .single();

  if (insertError) throw insertError;
  return mapRowToSettings(inserted);
}

export async function getAdminSettings() {
  return isSupabaseAdminConfigured ? getRemoteAdminSettings() : getLocalAdminSettings();
}

export async function isAllowedAdminEmail(email?: string | null) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return false;
  const settings = await getAdminSettings();
  return settings.adminEmails.includes(normalized);
}

export async function verifyAdminPassword(password: string) {
  if (!password) return false;
  const settings = await getAdminSettings();
  return verifyPasswordHash(password, settings.passwordHash);
}

export async function updateAdminSettings(params: {
  adminEmails?: string[];
  newPassword?: string;
}) {
  const current = await getAdminSettings();
  const next = {
    adminEmails: params.adminEmails ? normalizeEmails(params.adminEmails) : current.adminEmails,
    passwordHash: params.newPassword ? createPasswordHash(params.newPassword) : current.passwordHash,
    updatedAt: new Date().toISOString(),
  } satisfies AdminSettings;

  if (!isSupabaseAdminConfigured) {
    await setLocalAdminSettings(next);
    return next;
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from('admin_settings')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const payload = {
    admin_emails: next.adminEmails,
    password_hash: next.passwordHash,
    updated_at: next.updatedAt,
  };

  if (existing?.id) {
    const { error } = await supabase.from('admin_settings').update(payload).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('admin_settings').insert(payload);
    if (error) throw error;
  }

  return next;
}

import { randomUUID } from 'crypto';
import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

export interface AdminAuditEntry {
  id: string;
  action: string;
  actorEmail: string;
  summary: string;
  targetEmail?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const ADMIN_AUDIT_FILE = 'admin-audit-log.json';

function mapRowToEntry(row: any): AdminAuditEntry {
  return {
    id: row.id,
    action: row.action,
    actorEmail: row.actor_email,
    summary: row.summary,
    targetEmail: row.target_email || undefined,
    metadata: row.metadata || undefined,
    createdAt: row.created_at,
  };
}

async function readLocalAuditEntries() {
  const items = await readJsonFile<AdminAuditEntry[]>(ADMIN_AUDIT_FILE, []);
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

async function writeLocalAuditEntries(items: AdminAuditEntry[]) {
  await writeJsonFile(ADMIN_AUDIT_FILE, items);
}

async function ensureRemoteSeeded() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('admin_audit_log')
    .select('id', { count: 'exact', head: true });

  if (error) throw error;
  if ((count || 0) > 0) return;

  const localItems = await readLocalAuditEntries();
  if (localItems.length === 0) return;

  const { error: insertError } = await supabase
    .from('admin_audit_log')
    .insert(localItems.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actor_email: entry.actorEmail,
      summary: entry.summary,
      target_email: entry.targetEmail || null,
      metadata: entry.metadata || null,
      created_at: entry.createdAt,
    })));

  if (insertError) throw insertError;
}

export async function listAdminAuditEntries() {
  if (!isSupabaseAdminConfigured) {
    return readLocalAuditEntries();
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('id, action, actor_email, summary, target_email, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(400);

  if (error) throw error;
  return Array.isArray(data) ? data.map(mapRowToEntry) : [];
}

export async function addAdminAuditEntry(entry: Omit<AdminAuditEntry, 'id' | 'createdAt'>) {
  if (!isSupabaseAdminConfigured) {
    const items = await readLocalAuditEntries();
    const nextEntry: AdminAuditEntry = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...entry,
    };
    await writeLocalAuditEntries([nextEntry, ...items].slice(0, 400));
    return nextEntry;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const payload = {
    action: entry.action,
    actor_email: entry.actorEmail,
    summary: entry.summary,
    target_email: entry.targetEmail || null,
    metadata: entry.metadata || null,
  };

  const { data, error } = await supabase
    .from('admin_audit_log')
    .insert(payload)
    .select('id, action, actor_email, summary, target_email, metadata, created_at')
    .single();

  if (error) throw error;
  return mapRowToEntry(data);
}

export async function removeAdminAuditEntry(id: string) {
  if (!isSupabaseAdminConfigured) {
    const items = await readLocalAuditEntries();
    const existing = items.find((item) => item.id === id);
    if (!existing) return null;
    await writeLocalAuditEntries(items.filter((item) => item.id !== id));
    return existing;
  }

  await ensureRemoteSeeded();
  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase
    .from('admin_audit_log')
    .select('id, action, actor_email, summary, target_email, metadata, created_at')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) return null;

  const { error } = await supabase
    .from('admin_audit_log')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return mapRowToEntry(existing);
}

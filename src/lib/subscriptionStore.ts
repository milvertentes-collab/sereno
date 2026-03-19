import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';
import { BillingPlanKey, PLAN_DEFINITIONS, SubscriptionRecord } from './subscriptionPlans';

type SubscriptionFile = {
  records: SubscriptionRecord[];
};

function normalizeEmail(email: string) {
  return String(email || '').trim().toLowerCase();
}

function mapRowToRecord(row: any): SubscriptionRecord {
  return {
    email: row.email,
    customerName: row.customer_name || undefined,
    accessTier: row.access_tier,
    planKey: row.plan_key,
    status: row.status,
    billingCycle: row.billing_cycle,
    isLifetime: Boolean(row.is_lifetime),
    checkoutId: row.checkout_id || undefined,
    provider: row.provider || undefined,
    checkoutUrl: row.checkout_url || undefined,
    activatedAt: row.activated_at || undefined,
    expiresAt: row.expires_at || null,
    pendingAt: row.pending_at || undefined,
    providerSubscriptionId: row.provider_subscription_id || undefined,
    purchaseToken: row.purchase_token || undefined,
    packageName: row.package_name || undefined,
    productId: row.product_id || undefined,
    sourceChannel: row.source_channel || undefined,
    updatedAt: row.updated_at,
  };
}

async function readLocalSubscriptions() {
  return readJsonFile<SubscriptionFile>('subscriptions.json', { records: [] });
}

async function writeLocalSubscriptions(records: SubscriptionRecord[]) {
  await writeJsonFile<SubscriptionFile>('subscriptions.json', { records });
}

function matchRecord(records: SubscriptionRecord[], email: string) {
  return records.find((entry) => normalizeEmail(entry.email) === normalizeEmail(email)) || null;
}

function matchRecordByCheckoutId(records: SubscriptionRecord[], checkoutId: string) {
  const normalized = String(checkoutId || '').trim();
  return records.find((entry) => String(entry.checkoutId || '').trim() === normalized) || null;
}

async function listRemoteSubscriptions() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscription_records')
    .select('email, customer_name, access_tier, plan_key, status, billing_cycle, is_lifetime, checkout_id, provider, checkout_url, activated_at, expires_at, pending_at, provider_subscription_id, purchase_token, package_name, product_id, source_channel, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? data.map(mapRowToRecord) : [];
}

async function upsertRemoteSubscription(record: SubscriptionRecord) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('subscription_records')
    .upsert({
      email: normalizeEmail(record.email),
      customer_name: record.customerName || null,
      access_tier: record.accessTier,
      plan_key: record.planKey,
      status: record.status,
      billing_cycle: record.billingCycle,
      is_lifetime: record.isLifetime,
      checkout_id: record.checkoutId || null,
      provider: record.provider || null,
      checkout_url: record.checkoutUrl || null,
      activated_at: record.activatedAt || null,
      expires_at: record.expiresAt || null,
      pending_at: record.pendingAt || null,
      provider_subscription_id: record.providerSubscriptionId || null,
      purchase_token: record.purchaseToken || null,
      package_name: record.packageName || null,
      product_id: record.productId || null,
      source_channel: record.sourceChannel || null,
      updated_at: record.updatedAt,
    }, { onConflict: 'email' });

  if (error) throw error;
}

async function ensureRemoteSeeded() {
  const remote = await listRemoteSubscriptions();
  if (remote.length > 0) return remote;

  const local = await readLocalSubscriptions();
  for (const record of local.records) {
    await upsertRemoteSubscription(record);
  }
  return listRemoteSubscriptions();
}

export async function getSubscriptionByEmail(email: string) {
  if (!isSupabaseAdminConfigured) {
    const file = await readLocalSubscriptions();
    return matchRecord(file.records, email);
  }

  const records = await ensureRemoteSeeded();
  return matchRecord(records, email);
}

export async function getSubscriptionByCheckoutId(checkoutId: string) {
  const normalized = String(checkoutId || '').trim();
  if (!normalized) return null;

  if (!isSupabaseAdminConfigured) {
    const file = await readLocalSubscriptions();
    return matchRecordByCheckoutId(file.records, normalized);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscription_records')
    .select('email, customer_name, access_tier, plan_key, status, billing_cycle, is_lifetime, checkout_id, provider, checkout_url, activated_at, expires_at, pending_at, provider_subscription_id, purchase_token, package_name, product_id, source_channel, updated_at')
    .eq('checkout_id', normalized)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapRowToRecord(data);

  const records = await ensureRemoteSeeded();
  return matchRecordByCheckoutId(records, normalized);
}

export async function getSubscriptionByPurchaseToken(purchaseToken: string) {
  const normalized = String(purchaseToken || '').trim();
  if (!normalized) return null;

  if (!isSupabaseAdminConfigured) {
    const file = await readLocalSubscriptions();
    return file.records.find((entry) => String(entry.purchaseToken || '').trim() === normalized) || null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscription_records')
    .select('email, customer_name, access_tier, plan_key, status, billing_cycle, is_lifetime, checkout_id, provider, checkout_url, activated_at, expires_at, pending_at, provider_subscription_id, purchase_token, package_name, product_id, source_channel, updated_at')
    .eq('purchase_token', normalized)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToRecord(data) : null;
}

export async function listSubscriptions() {
  if (!isSupabaseAdminConfigured) {
    const file = await readLocalSubscriptions();
    return [...file.records].sort((a, b) => {
      const left = new Date(b.updatedAt || b.activatedAt || b.pendingAt || 0).getTime();
      const right = new Date(a.updatedAt || a.activatedAt || a.pendingAt || 0).getTime();
      return left - right;
    });
  }

  return ensureRemoteSeeded();
}

export async function upsertPendingCheckout(params: {
  email: string;
  customerName?: string;
  planKey: BillingPlanKey;
  checkoutId: string;
  checkoutUrl?: string;
  provider?: string;
  providerSubscriptionId?: string;
  purchaseToken?: string;
  packageName?: string;
  productId?: string;
  sourceChannel?: SubscriptionRecord['sourceChannel'];
}) {
  const now = new Date().toISOString();
  const plan = PLAN_DEFINITIONS[params.planKey];

  const localRecord: SubscriptionRecord = {
    email: normalizeEmail(params.email),
    customerName: params.customerName,
    accessTier: 'free',
    planKey: params.planKey,
    status: 'pending',
    billingCycle: plan.billingCycle,
    isLifetime: Boolean(plan.isLifetime),
    checkoutId: params.checkoutId,
    checkoutUrl: params.checkoutUrl,
    provider: params.provider || 'external_link',
    pendingAt: now,
    providerSubscriptionId: params.providerSubscriptionId,
    purchaseToken: params.purchaseToken,
    packageName: params.packageName,
    productId: params.productId,
    sourceChannel: params.sourceChannel || 'web',
    updatedAt: now,
  };

  if (!isSupabaseAdminConfigured) {
    const file = await readLocalSubscriptions();
    await writeLocalSubscriptions([localRecord, ...file.records.filter((entry) => normalizeEmail(entry.email) !== localRecord.email)]);
    return localRecord;
  }

  const previous = await getSubscriptionByEmail(localRecord.email);
  const merged = { ...previous, ...localRecord } satisfies SubscriptionRecord;
  await upsertRemoteSubscription(merged);
  return merged;
}

export async function activateSubscription(params: {
  email: string;
  planKey: BillingPlanKey;
  checkoutId?: string;
  expiresAt?: string | null;
  provider?: string;
  providerSubscriptionId?: string;
  purchaseToken?: string;
  packageName?: string;
  productId?: string;
  sourceChannel?: SubscriptionRecord['sourceChannel'];
}) {
  const now = new Date().toISOString();
  const plan = PLAN_DEFINITIONS[params.planKey];

  const localRecord: SubscriptionRecord = {
    email: normalizeEmail(params.email),
    accessTier: plan.accessTier,
    planKey: params.planKey,
    status: 'active',
    billingCycle: plan.billingCycle,
    isLifetime: Boolean(plan.isLifetime),
    checkoutId: params.checkoutId,
    provider: params.provider || 'external_link',
    activatedAt: now,
    expiresAt: plan.isLifetime ? null : (params.expiresAt ?? null),
    providerSubscriptionId: params.providerSubscriptionId,
    purchaseToken: params.purchaseToken,
    packageName: params.packageName,
    productId: params.productId,
    sourceChannel: params.sourceChannel || 'web',
    updatedAt: now,
  };

  if (!isSupabaseAdminConfigured) {
    const file = await readLocalSubscriptions();
    const previous = matchRecord(file.records, params.email);
    const merged = { ...previous, ...localRecord } as SubscriptionRecord;
    await writeLocalSubscriptions([merged, ...file.records.filter((entry) => normalizeEmail(entry.email) !== localRecord.email)]);
    return merged;
  }

  const previous = await getSubscriptionByEmail(localRecord.email);
  const merged = { ...previous, ...localRecord } as SubscriptionRecord;
  await upsertRemoteSubscription(merged);
  return merged;
}

export async function upsertAdminGrantedSubscription(params: {
  email: string;
  customerName?: string;
  planKey: BillingPlanKey;
  expiresAt?: string | null;
}) {
  const record = await activateSubscription({
    email: params.email,
    planKey: params.planKey,
    expiresAt: params.expiresAt,
    provider: 'admin_panel',
  });

  const merged = {
    ...record,
    customerName: params.customerName || record.customerName,
    updatedAt: new Date().toISOString(),
  } satisfies SubscriptionRecord;

  if (!isSupabaseAdminConfigured) {
    const file = await readLocalSubscriptions();
    await writeLocalSubscriptions([merged, ...file.records.filter((entry) => normalizeEmail(entry.email) !== normalizeEmail(params.email))]);
    return merged;
  }

  await upsertRemoteSubscription(merged);
  return merged;
}

export async function revokeSubscriptionByEmail(email: string) {
  const now = new Date().toISOString();
  const previous = await getSubscriptionByEmail(email);
  if (!previous) return null;

  const revoked: SubscriptionRecord = {
    ...previous,
    accessTier: 'free',
    planKey: 'free',
    status: 'canceled',
    billingCycle: null,
    isLifetime: false,
    expiresAt: now,
    updatedAt: now,
  };

  if (!isSupabaseAdminConfigured) {
    const file = await readLocalSubscriptions();
    await writeLocalSubscriptions([revoked, ...file.records.filter((entry) => normalizeEmail(entry.email) !== normalizeEmail(email))]);
    return revoked;
  }

  await upsertRemoteSubscription(revoked);
  return revoked;
}

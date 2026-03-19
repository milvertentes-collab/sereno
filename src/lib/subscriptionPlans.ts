export type AccessTier = 'free' | 'pro';

export type SubscriptionStatus = 'inactive' | 'pending' | 'active' | 'canceled' | 'expired';

export type BillingCycle = 'monthly' | 'annual' | 'group' | 'company' | 'lifetime' | null;
export type PlanAccessScope = 'solo' | 'shared' | 'company';
export type PlanGroupType = 'free' | 'individual' | 'vitalicio' | 'casal' | 'amigos' | 'familia' | 'empresa';

export type BillingPlanKey =
  | 'free'
  | 'pro_individual_monthly'
  | 'pro_individual_annual'
  | 'pro_casal_monthly'
  | 'pro_casal_annual'
  | 'pro_familia_monthly'
  | 'pro_familia_annual'
  | 'pro_amigos_monthly'
  | 'pro_amigos_annual'
  | 'pro_empresa'
  | 'pro_empresa_anual'
  | 'pro_empresa_pequena_mensal'
  | 'pro_empresa_pequena_anual'
  | 'pro_empresa_media_mensal'
  | 'pro_empresa_media_anual'
  | 'pro_empresa_grande_mensal'
  | 'pro_empresa_grande_anual'
  | 'vitalicio';

export interface SubscriptionRecord {
  email: string;
  customerName?: string;
  accessTier: AccessTier;
  planKey: BillingPlanKey;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  isLifetime: boolean;
  checkoutId?: string;
  provider?: string;
  checkoutUrl?: string;
  activatedAt?: string;
  expiresAt?: string | null;
  pendingAt?: string;
  providerSubscriptionId?: string;
  purchaseToken?: string;
  packageName?: string;
  productId?: string;
  sourceChannel?: 'web' | 'android_play' | 'admin' | 'promo' | 'unknown';
  updatedAt: string;
}

export interface PlanDefinition {
  key: BillingPlanKey;
  label: string;
  shortLabel: string;
  accessTier: AccessTier;
  peopleLabel: string;
  seatLimit: number;
  accessScope: PlanAccessScope;
  groupType: PlanGroupType;
  billingCycle: BillingCycle;
  providerEnvKey?: string;
  googlePlayProductEnvKey?: string;
  isLifetime?: boolean;
  isInstitutional?: boolean;
}

export const PLAN_DEFINITIONS: Record<BillingPlanKey, PlanDefinition> = {
  free: {
    key: 'free',
    label: 'Grátis',
    shortLabel: 'Grátis',
    accessTier: 'free',
    peopleLabel: '1 pessoa',
    seatLimit: 1,
    accessScope: 'solo',
    groupType: 'free',
    billingCycle: null,
  },
  pro_individual_monthly: {
    key: 'pro_individual_monthly',
    label: 'Pro Individual Mensal',
    shortLabel: 'Pro Individual',
    accessTier: 'pro',
    peopleLabel: '1 pessoa',
    seatLimit: 1,
    accessScope: 'solo',
    groupType: 'individual',
    billingCycle: 'monthly',
    providerEnvKey: 'PAYMENT_LINK_PRO_INDIVIDUAL_MONTHLY',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_INDIVIDUAL_MONTHLY',
  },
  pro_individual_annual: {
    key: 'pro_individual_annual',
    label: 'Pro Individual Anual',
    shortLabel: 'Pro Individual',
    accessTier: 'pro',
    peopleLabel: '1 pessoa',
    seatLimit: 1,
    accessScope: 'solo',
    groupType: 'individual',
    billingCycle: 'annual',
    providerEnvKey: 'PAYMENT_LINK_PRO_INDIVIDUAL_ANNUAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_INDIVIDUAL_ANNUAL',
  },
  pro_casal_monthly: {
    key: 'pro_casal_monthly',
    label: 'Pro Casal Mensal',
    shortLabel: 'Pro Casal',
    accessTier: 'pro',
    peopleLabel: '2 pessoas',
    seatLimit: 2,
    accessScope: 'shared',
    groupType: 'casal',
    billingCycle: 'monthly',
    providerEnvKey: 'PAYMENT_LINK_PRO_CASAL_MONTHLY',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_CASAL_MONTHLY',
  },
  pro_casal_annual: {
    key: 'pro_casal_annual',
    label: 'Pro Casal Anual',
    shortLabel: 'Pro Casal',
    accessTier: 'pro',
    peopleLabel: '2 pessoas',
    seatLimit: 2,
    accessScope: 'shared',
    groupType: 'casal',
    billingCycle: 'annual',
    providerEnvKey: 'PAYMENT_LINK_PRO_CASAL_ANNUAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_CASAL_ANNUAL',
  },
  pro_familia_monthly: {
    key: 'pro_familia_monthly',
    label: 'Pro Família Mensal',
    shortLabel: 'Pro Família',
    accessTier: 'pro',
    peopleLabel: 'até 6 pessoas',
    seatLimit: 6,
    accessScope: 'shared',
    groupType: 'familia',
    billingCycle: 'monthly',
    providerEnvKey: 'PAYMENT_LINK_PRO_FAMILIA_MONTHLY',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_FAMILIA_MONTHLY',
  },
  pro_familia_annual: {
    key: 'pro_familia_annual',
    label: 'Pro Família Anual',
    shortLabel: 'Pro Família',
    accessTier: 'pro',
    peopleLabel: 'até 6 pessoas',
    seatLimit: 6,
    accessScope: 'shared',
    groupType: 'familia',
    billingCycle: 'annual',
    providerEnvKey: 'PAYMENT_LINK_PRO_FAMILIA_ANNUAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_FAMILIA_ANNUAL',
  },
  pro_amigos_monthly: {
    key: 'pro_amigos_monthly',
    label: 'Pro Amigos Mensal',
    shortLabel: 'Pro Amigos',
    accessTier: 'pro',
    peopleLabel: 'até 5 pessoas',
    seatLimit: 5,
    accessScope: 'shared',
    groupType: 'amigos',
    billingCycle: 'monthly',
    providerEnvKey: 'PAYMENT_LINK_PRO_AMIGOS_MONTHLY',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_AMIGOS_MONTHLY',
  },
  pro_amigos_annual: {
    key: 'pro_amigos_annual',
    label: 'Pro Amigos Anual',
    shortLabel: 'Pro Amigos',
    accessTier: 'pro',
    peopleLabel: 'até 5 pessoas',
    seatLimit: 5,
    accessScope: 'shared',
    groupType: 'amigos',
    billingCycle: 'annual',
    providerEnvKey: 'PAYMENT_LINK_PRO_AMIGOS_ANNUAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_AMIGOS_ANNUAL',
  },
  pro_empresa: {
    key: 'pro_empresa',
    label: 'Pro Empresa Mensal',
    shortLabel: 'Pro Empresa',
    accessTier: 'pro',
    peopleLabel: 'Equipe / empresa',
    seatLimit: 50,
    accessScope: 'company',
    groupType: 'empresa',
    billingCycle: 'company',
    providerEnvKey: 'PAYMENT_LINK_PRO_EMPRESA',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_EMPRESA',
    isInstitutional: true,
  },
  pro_empresa_anual: {
    key: 'pro_empresa_anual',
    label: 'Pro Empresa',
    shortLabel: 'Pro Empresa',
    accessTier: 'pro',
    peopleLabel: 'Equipe / empresa',
    seatLimit: 50,
    accessScope: 'company',
    groupType: 'empresa',
    billingCycle: 'annual',
    providerEnvKey: 'PAYMENT_LINK_PRO_EMPRESA_ANUAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_EMPRESA_ANUAL',
    isInstitutional: true,
  },
  pro_empresa_pequena_mensal: {
    key: 'pro_empresa_pequena_mensal',
    label: 'Pro Empresa Pequena Mensal',
    shortLabel: 'Pro Empresa Pequena',
    accessTier: 'pro',
    peopleLabel: 'até 10 pessoas',
    seatLimit: 10,
    accessScope: 'company',
    groupType: 'empresa',
    billingCycle: 'company',
    providerEnvKey: 'PAYMENT_LINK_PRO_EMPRESA_PEQUENA_MENSAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_EMPRESA_PEQUENA_MENSAL',
    isInstitutional: true,
  },
  pro_empresa_pequena_anual: {
    key: 'pro_empresa_pequena_anual',
    label: 'Pro Empresa Pequena Anual',
    shortLabel: 'Pro Empresa Pequena',
    accessTier: 'pro',
    peopleLabel: 'até 10 pessoas',
    seatLimit: 10,
    accessScope: 'company',
    groupType: 'empresa',
    billingCycle: 'annual',
    providerEnvKey: 'PAYMENT_LINK_PRO_EMPRESA_PEQUENA_ANUAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_EMPRESA_PEQUENA_ANUAL',
    isInstitutional: true,
  },
  pro_empresa_media_mensal: {
    key: 'pro_empresa_media_mensal',
    label: 'Pro Empresa Média Mensal',
    shortLabel: 'Pro Empresa Média',
    accessTier: 'pro',
    peopleLabel: 'até 25 pessoas',
    seatLimit: 25,
    accessScope: 'company',
    groupType: 'empresa',
    billingCycle: 'company',
    providerEnvKey: 'PAYMENT_LINK_PRO_EMPRESA_MEDIA_MENSAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_EMPRESA_MEDIA_MENSAL',
    isInstitutional: true,
  },
  pro_empresa_media_anual: {
    key: 'pro_empresa_media_anual',
    label: 'Pro Empresa Média Anual',
    shortLabel: 'Pro Empresa Média',
    accessTier: 'pro',
    peopleLabel: 'até 25 pessoas',
    seatLimit: 25,
    accessScope: 'company',
    groupType: 'empresa',
    billingCycle: 'annual',
    providerEnvKey: 'PAYMENT_LINK_PRO_EMPRESA_MEDIA_ANUAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_EMPRESA_MEDIA_ANUAL',
    isInstitutional: true,
  },
  pro_empresa_grande_mensal: {
    key: 'pro_empresa_grande_mensal',
    label: 'Pro Empresa Grande Mensal',
    shortLabel: 'Pro Empresa Grande',
    accessTier: 'pro',
    peopleLabel: 'até 50 pessoas',
    seatLimit: 50,
    accessScope: 'company',
    groupType: 'empresa',
    billingCycle: 'company',
    providerEnvKey: 'PAYMENT_LINK_PRO_EMPRESA_GRANDE_MENSAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_EMPRESA_GRANDE_MENSAL',
    isInstitutional: true,
  },
  pro_empresa_grande_anual: {
    key: 'pro_empresa_grande_anual',
    label: 'Pro Empresa Grande Anual',
    shortLabel: 'Pro Empresa Grande',
    accessTier: 'pro',
    peopleLabel: 'até 50 pessoas',
    seatLimit: 50,
    accessScope: 'company',
    groupType: 'empresa',
    billingCycle: 'annual',
    providerEnvKey: 'PAYMENT_LINK_PRO_EMPRESA_GRANDE_ANUAL',
    googlePlayProductEnvKey: 'GOOGLE_PLAY_PRODUCT_PRO_EMPRESA_GRANDE_ANUAL',
    isInstitutional: true,
  },
  vitalicio: {
    key: 'vitalicio',
    label: 'Acesso Vitalício',
    shortLabel: 'Vitalício',
    accessTier: 'pro',
    peopleLabel: 'Oferta limitada',
    seatLimit: 1,
    accessScope: 'solo',
    groupType: 'vitalicio',
    billingCycle: 'lifetime',
    providerEnvKey: 'PAYMENT_LINK_VITALICIO',
    isLifetime: true,
  },
};

export function getPlanDefinition(planKey: BillingPlanKey) {
  return PLAN_DEFINITIONS[planKey];
}

export function getPlanSeatLimit(planKey?: BillingPlanKey) {
  if (!planKey || !PLAN_DEFINITIONS[planKey]) return 1;
  return PLAN_DEFINITIONS[planKey].seatLimit;
}

export function isSharedAccessPlan(planKey?: BillingPlanKey) {
  if (!planKey || !PLAN_DEFINITIONS[planKey]) return false;
  return PLAN_DEFINITIONS[planKey].seatLimit > 1;
}

export function getPublicPlanLabel(planKey?: BillingPlanKey, accessTier: AccessTier = 'free') {
  if (!planKey || planKey === 'free') return accessTier === 'pro' ? 'Sereno Pro' : 'Gratuito';
  return PLAN_DEFINITIONS[planKey]?.label || 'Sereno Pro';
}

export function getGooglePlayProductId(planKey: BillingPlanKey) {
  const envKey = PLAN_DEFINITIONS[planKey]?.googlePlayProductEnvKey;
  return envKey ? process.env[envKey] || '' : '';
}

export function getPlanKeyByGooglePlayProductId(productId: string) {
  const normalized = String(productId || '').trim();
  if (!normalized) return null;
  const match = Object.values(PLAN_DEFINITIONS).find((plan) => {
    if (!plan.googlePlayProductEnvKey) return false;
    return String(process.env[plan.googlePlayProductEnvKey] || '').trim() === normalized;
  });
  return match?.key || null;
}

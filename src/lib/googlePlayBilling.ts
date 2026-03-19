import { createSign } from 'crypto';
import { getPlanKeyByGooglePlayProductId } from './subscriptionPlans';

type GoogleAccessTokenCache = {
  token: string;
  expiresAt: number;
} | null;

let accessTokenCache: GoogleAccessTokenCache = null;

export type GooglePlaySubscriptionState =
  | 'SUBSCRIPTION_STATE_ACTIVE'
  | 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
  | 'SUBSCRIPTION_STATE_ON_HOLD'
  | 'SUBSCRIPTION_STATE_PAUSED'
  | 'SUBSCRIPTION_STATE_CANCELED'
  | 'SUBSCRIPTION_STATE_EXPIRED'
  | 'SUBSCRIPTION_STATE_PENDING'
  | 'UNKNOWN';

export type GooglePlayResolvedSubscription = {
  packageName: string;
  purchaseToken: string;
  subscriptionState: GooglePlaySubscriptionState;
  isEntitled: boolean;
  expiryTime: string | null;
  productId: string;
  planKey: ReturnType<typeof getPlanKeyByGooglePlayProductId>;
  providerSubscriptionId: string;
  linkedPurchaseToken: string | null;
  raw: Record<string, any>;
};

function base64UrlEncode(input: Buffer | string) {
  const base64 = Buffer.from(input).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function getServiceAccountCredentials() {
  const json = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON || '';
  if (json.trim()) {
    const parsed = JSON.parse(json);
    return {
      clientEmail: String(parsed.client_email || '').trim(),
      privateKey: String(parsed.private_key || '').replace(/\\n/g, '\n').trim(),
    };
  }

  return {
    clientEmail: String(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL || '').trim(),
    privateKey: String(process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim(),
  };
}

export function getGooglePlayPackageName() {
  return String(process.env.GOOGLE_PLAY_PACKAGE_NAME || '').trim();
}

export function isGooglePlayConfigured() {
  const credentials = getServiceAccountCredentials();
  return Boolean(getGooglePlayPackageName() && credentials.clientEmail && credentials.privateKey);
}

async function getGoogleAccessToken() {
  if (accessTokenCache && accessTokenCache.expiresAt > Date.now() + 60_000) {
    return accessTokenCache.token;
  }

  const { clientEmail, privateKey } = getServiceAccountCredentials();
  if (!clientEmail || !privateKey) {
    throw new Error('Defina as credenciais da service account do Google Play.');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedJwt = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${unsignedJwt}.${base64UrlEncode(signature)}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });

  if (!tokenResponse.ok) {
    throw new Error(await tokenResponse.text() || 'Falha ao gerar access token do Google Play.');
  }

  const tokenData = await tokenResponse.json();
  const accessToken = String(tokenData.access_token || '').trim();
  const expiresIn = Number(tokenData.expires_in || 3600);
  if (!accessToken) {
    throw new Error('Google Play não retornou access token.');
  }

  accessTokenCache = {
    token: accessToken,
    expiresAt: Date.now() + Math.max(60, expiresIn - 120) * 1000,
  };

  return accessToken;
}

function resolveSubscriptionState(rawState: string): GooglePlaySubscriptionState {
  const normalized = String(rawState || '').trim();
  switch (normalized) {
    case 'SUBSCRIPTION_STATE_ACTIVE':
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD':
    case 'SUBSCRIPTION_STATE_ON_HOLD':
    case 'SUBSCRIPTION_STATE_PAUSED':
    case 'SUBSCRIPTION_STATE_CANCELED':
    case 'SUBSCRIPTION_STATE_EXPIRED':
    case 'SUBSCRIPTION_STATE_PENDING':
      return normalized;
    default:
      return 'UNKNOWN';
  }
}

export function isGooglePlayEntitled(state: GooglePlaySubscriptionState) {
  return state === 'SUBSCRIPTION_STATE_ACTIVE' || state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';
}

export async function getGooglePlaySubscription(params: {
  purchaseToken: string;
  packageName?: string;
}) {
  const purchaseToken = String(params.purchaseToken || '').trim();
  const packageName = String(params.packageName || getGooglePlayPackageName()).trim();
  if (!purchaseToken || !packageName) {
    throw new Error('purchaseToken e packageName são obrigatórios para validar a assinatura da Play.');
  }

  if (!isGooglePlayConfigured()) {
    throw new Error('Google Play Billing server-side não configurado.');
  }

  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(await response.text() || 'Falha ao consultar assinatura da Play.');
  }

  const raw = await response.json();
  const lineItems = Array.isArray(raw.lineItems) ? raw.lineItems : [];
  const primaryLineItem = lineItems[0] || {};
  const expiryTime = String(primaryLineItem.expiryTime || '').trim() || null;
  const productId = String(primaryLineItem.productId || raw.subscriptionId || '').trim();
  const subscriptionState = resolveSubscriptionState(raw.subscriptionState);
  const providerSubscriptionId = String(raw.latestOrderId || raw.kind || purchaseToken).trim();

  return {
    packageName,
    purchaseToken,
    subscriptionState,
    isEntitled: isGooglePlayEntitled(subscriptionState),
    expiryTime,
    productId,
    planKey: getPlanKeyByGooglePlayProductId(productId),
    providerSubscriptionId,
    linkedPurchaseToken: String(raw.linkedPurchaseToken || '').trim() || null,
    raw,
  } satisfies GooglePlayResolvedSubscription;
}

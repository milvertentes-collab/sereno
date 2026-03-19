import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { upsertPendingCheckout } from '@/lib/subscriptionStore';
import { BillingPlanKey, getGooglePlayProductId, PLAN_DEFINITIONS } from '@/lib/subscriptionPlans';
import { getLifetimeOfferState } from '@/lib/lifetimeOffer';
import { getStoredLifetimeOfferWindow } from '@/lib/lifetimeOfferStore';

function buildProviderUrl(rawUrl: string, params: Record<string, string>) {
  const url = new URL(rawUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email?.trim();
  const customerName = body?.customerName?.trim();
  const planKey = body?.planKey as BillingPlanKey | undefined;
  const channel = body?.channel === 'android_play' ? 'android_play' : 'web';

  if (!email || !planKey || !PLAN_DEFINITIONS[planKey] || planKey === 'free') {
    return NextResponse.json({ error: 'Plano ou email inválido.' }, { status: 400 });
  }

  if (planKey === 'vitalicio') {
    const runtimeConfig = await getStoredLifetimeOfferWindow();
    const lifetimeState = getLifetimeOfferState(new Date(), runtimeConfig);
    if (!lifetimeState.isActive) {
      return NextResponse.json({ error: 'A oferta vitalícia não está ativa no momento.' }, { status: 403 });
    }
  }

  const plan = PLAN_DEFINITIONS[planKey];

  if (channel === 'android_play') {
    const productId = getGooglePlayProductId(planKey);
    if (!productId) {
      return NextResponse.json({
        error: `Configure ${plan.googlePlayProductEnvKey} para usar este plano na Google Play.`,
      }, { status: 503 });
    }

    return NextResponse.json({
      checkoutMode: 'google_play',
      productId,
      planKey,
      packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || '',
    });
  }

  const providerEnvKey = plan.providerEnvKey;
  const baseUrl = providerEnvKey ? process.env[providerEnvKey] : '';

  if (!baseUrl) {
    return NextResponse.json({ error: `Configure ${providerEnvKey} para usar este checkout.` }, { status: 503 });
  }

  const checkoutId = randomUUID();
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const returnUrl = `${appBaseUrl}/?subscription_return=1&checkout_id=${checkoutId}&plan=${planKey}`;
  const checkoutUrl = buildProviderUrl(baseUrl, {
    client_reference_id: checkoutId,
    external_reference: checkoutId,
    customer_email: email,
    email,
    plan: planKey,
    return_url: returnUrl,
  });

  await upsertPendingCheckout({
    email,
    customerName,
    planKey,
    checkoutId,
    checkoutUrl,
    provider: 'external_link',
    sourceChannel: 'web',
  });

  return NextResponse.json({ checkoutUrl, checkoutId });
}

import { NextRequest, NextResponse } from 'next/server';
import { activateSubscription, getSubscriptionByPurchaseToken, revokeSubscriptionByEmail } from '@/lib/subscriptionStore';
import { getGooglePlaySubscription } from '@/lib/googlePlayBilling';

function isAuthorized(req: NextRequest) {
  const expectedSecret = process.env.SERENO_BILLING_WEBHOOK_SECRET || '';
  if (!expectedSecret) return true;

  const receivedHeader = req.headers.get('x-sereno-webhook-secret') || '';
  const receivedQuery = req.nextUrl.searchParams.get('secret') || '';
  return receivedHeader === expectedSecret || receivedQuery === expectedSecret;
}

function decodePubSubPayload(data: string) {
  try {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Webhook não autorizado.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const envelope = body?.message?.data ? decodePubSubPayload(String(body.message.data)) : body;
  if (!envelope) {
    return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 });
  }

  if (envelope.testNotification) {
    return NextResponse.json({ ok: true, source: 'google_play', test: true });
  }

  const subscriptionNotification = envelope.subscriptionNotification || null;

  if (!subscriptionNotification?.purchaseToken) {
    return NextResponse.json({ ok: false, error: 'Notificação da Play sem purchaseToken.' }, { status: 400 });
  }

  try {
    const purchaseToken = String(subscriptionNotification.purchaseToken).trim();
    const googleSubscription = await getGooglePlaySubscription({
      purchaseToken,
      packageName: String(subscriptionNotification.packageName || '').trim(),
    });

    const currentRecord =
      (await getSubscriptionByPurchaseToken(purchaseToken)) ||
      (googleSubscription.linkedPurchaseToken
        ? await getSubscriptionByPurchaseToken(googleSubscription.linkedPurchaseToken)
        : null);

    if (!currentRecord?.email) {
      return NextResponse.json({
        ok: true,
        source: 'google_play',
        ignored: true,
        reason: 'purchase_token_not_linked',
      });
    }

    if (googleSubscription.isEntitled && googleSubscription.planKey) {
      const record = await activateSubscription({
        email: currentRecord.email,
        planKey: googleSubscription.planKey,
        provider: 'google_play',
        providerSubscriptionId: googleSubscription.providerSubscriptionId,
        purchaseToken: googleSubscription.purchaseToken,
        packageName: googleSubscription.packageName,
        productId: googleSubscription.productId,
        sourceChannel: 'android_play',
        expiresAt: googleSubscription.expiryTime,
      });

      return NextResponse.json({
        ok: true,
        source: 'google_play',
        subscription: record,
        providerState: googleSubscription.subscriptionState,
      });
    }

    const revoked = await revokeSubscriptionByEmail(currentRecord.email);
    return NextResponse.json({
      ok: true,
      source: 'google_play',
      revoked,
      providerState: googleSubscription.subscriptionState,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro inesperado.' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { activateSubscription } from '@/lib/subscriptionStore';
import { getGooglePlaySubscription } from '@/lib/googlePlayBilling';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const customerName = String(body?.customerName || '').trim() || undefined;
  const purchaseToken = String(body?.purchaseToken || '').trim();
  const packageName = String(body?.packageName || '').trim() || undefined;

  if (!email || !purchaseToken) {
    return NextResponse.json({ ok: false, error: 'email e purchaseToken são obrigatórios.' }, { status: 400 });
  }

  try {
    const googleSubscription = await getGooglePlaySubscription({ purchaseToken, packageName });

    if (!googleSubscription.planKey) {
      return NextResponse.json({
        ok: false,
        error: 'Produto da Play não mapeado para nenhum plano do app.',
        productId: googleSubscription.productId || null,
      }, { status: 400 });
    }

    if (!googleSubscription.isEntitled) {
      return NextResponse.json({
        ok: false,
        error: `Assinatura da Play sem acesso ativo (${googleSubscription.subscriptionState}).`,
        state: googleSubscription.subscriptionState,
      }, { status: 409 });
    }

    const record = await activateSubscription({
      email,
      planKey: googleSubscription.planKey,
      provider: 'google_play',
      providerSubscriptionId: googleSubscription.providerSubscriptionId,
      purchaseToken: googleSubscription.purchaseToken,
      packageName: googleSubscription.packageName,
      productId: googleSubscription.productId,
      sourceChannel: 'android_play',
      expiresAt: googleSubscription.expiryTime,
    });

    if (customerName && !record.customerName) {
      record.customerName = customerName;
    }

    return NextResponse.json({
      ok: true,
      subscription: record,
      providerState: googleSubscription.subscriptionState,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro inesperado.' },
      { status: 500 },
    );
  }
}

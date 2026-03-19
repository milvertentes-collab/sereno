import { NextRequest, NextResponse } from 'next/server';
import { activateSubscription, getSubscriptionByCheckoutId } from '@/lib/subscriptionStore';
import { BillingPlanKey, PLAN_DEFINITIONS } from '@/lib/subscriptionPlans';

type WebhookPayload = Record<string, any>;

function isAuthorized(req: NextRequest) {
  const expectedSecret = process.env.SERENO_BILLING_WEBHOOK_SECRET || '';
  if (!expectedSecret) return true;

  const receivedHeader = req.headers.get('x-sereno-webhook-secret') || '';
  const receivedQuery = req.nextUrl.searchParams.get('secret') || '';
  return receivedHeader === expectedSecret || receivedQuery === expectedSecret;
}

function isCustomConfirmedEvent(body: WebhookPayload) {
  return body?.event === 'payment_confirmed';
}

function isMercadoPagoSubscriptionNotification(body: WebhookPayload) {
  const type = String(body?.type || body?.action || '').toLowerCase();
  return type.includes('subscription_preapproval') || type.includes('preapproval');
}

function isMercadoPagoApprovedStatus(status: string) {
  const normalized = String(status || '').toLowerCase();
  return ['authorized', 'approved', 'active'].includes(normalized);
}

async function resolveMercadoPagoPreapproval(body: WebhookPayload) {
  const preapprovalId =
    body?.data?.id ||
    body?.id ||
    body?.resource?.id ||
    body?.preapproval_id ||
    body?.preapprovalId;

  if (!preapprovalId) {
    throw new Error('Webhook do Mercado Pago sem identificador da assinatura.');
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
  if (!accessToken) {
    throw new Error('Defina MERCADO_PAGO_ACCESS_TOKEN para validar notificações do Mercado Pago.');
  }

  const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(String(preapprovalId))}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Não foi possível consultar a assinatura no Mercado Pago.');
  }

  const preapproval = await response.json();
  return {
    status: String(preapproval?.status || ''),
    email: String(preapproval?.payer_email || preapproval?.payer?.email || '').trim().toLowerCase(),
    checkoutId: String(preapproval?.external_reference || preapproval?.externalReference || '').trim(),
    providerId: String(preapproval?.id || preapprovalId),
    raw: preapproval,
  };
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Webhook não autorizado.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as WebhookPayload | null;
  if (!body) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  try {
    if (isCustomConfirmedEvent(body)) {
      const email = body?.email?.trim();
      const planKey = body?.planKey as BillingPlanKey | undefined;

      if (!email || !planKey || !PLAN_DEFINITIONS[planKey]) {
        return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
      }

      const record = await activateSubscription({
        email,
        planKey,
        checkoutId: body?.checkoutId,
        expiresAt: body?.expiresAt ?? null,
        provider: body?.provider || 'external_link',
        sourceChannel: 'web',
      });

      return NextResponse.json({ ok: true, source: 'custom', subscription: record });
    }

    if (isMercadoPagoSubscriptionNotification(body)) {
      const preapproval = await resolveMercadoPagoPreapproval(body);

      if (!isMercadoPagoApprovedStatus(preapproval.status)) {
        return NextResponse.json({
          ok: true,
          source: 'mercado_pago',
          ignored: true,
          reason: `status_${preapproval.status || 'unknown'}`,
        });
      }

      const pendingRecord =
        (preapproval.checkoutId ? await getSubscriptionByCheckoutId(preapproval.checkoutId) : null);

      if (!pendingRecord?.email || !pendingRecord?.planKey || !PLAN_DEFINITIONS[pendingRecord.planKey]) {
        return NextResponse.json({
          ok: false,
          error: 'Não encontrei a assinatura pendente correspondente ao checkout.',
          checkoutId: preapproval.checkoutId || null,
          mercadoPagoId: preapproval.providerId,
        }, { status: 404 });
      }

      const record = await activateSubscription({
        email: pendingRecord.email,
        planKey: pendingRecord.planKey,
        checkoutId: preapproval.checkoutId || pendingRecord.checkoutId,
        provider: 'mercado_pago',
        expiresAt: null,
        sourceChannel: 'web',
      });

      return NextResponse.json({
        ok: true,
        source: 'mercado_pago',
        subscription: record,
        mercadoPagoId: preapproval.providerId,
      });
    }

    return NextResponse.json({ error: 'Evento não suportado.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro inesperado.' },
      { status: 500 },
    );
  }
}

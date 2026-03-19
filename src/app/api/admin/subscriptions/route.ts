import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminEmail, isAdminAuthenticated } from '@/lib/adminAuth';
import { addAdminAuditEntry } from '@/lib/adminAuditStore';
import { BillingPlanKey, PLAN_DEFINITIONS } from '@/lib/subscriptionPlans';
import { ensureSeatGroup } from '@/lib/subscriptionSeatGroupStore';
import { listSubscriptions, revokeSubscriptionByEmail, upsertAdminGrantedSubscription } from '@/lib/subscriptionStore';

function computeExpiresAt(planKey: BillingPlanKey) {
  const now = new Date();
  if (planKey === 'free' || PLAN_DEFINITIONS[planKey]?.isLifetime) return null;

  if (planKey.includes('monthly') || PLAN_DEFINITIONS[planKey]?.billingCycle === 'company') {
    now.setMonth(now.getMonth() + 1);
    return now.toISOString();
  }

  now.setFullYear(now.getFullYear() + 1);
  return now.toISOString();
}

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const records = await listSubscriptions();
  return NextResponse.json({ ok: true, records });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email = String(body?.email || '').trim().toLowerCase();
  const customerName = String(body?.customerName || '').trim();
  const planKey = body?.planKey as BillingPlanKey | undefined;

  if (!email || !planKey || !PLAN_DEFINITIONS[planKey] || planKey === 'free') {
    return NextResponse.json({ ok: false, error: 'E-mail e plano válido são obrigatórios.' }, { status: 400 });
  }

  const expiresAt = body?.expiresAt === null
    ? null
    : String(body?.expiresAt || '').trim()
      ? String(body.expiresAt)
      : computeExpiresAt(planKey);

  const record = await upsertAdminGrantedSubscription({
    email,
    customerName: customerName || undefined,
    planKey,
    expiresAt,
  });
  if (PLAN_DEFINITIONS[planKey].seatLimit > 1) {
    await ensureSeatGroup({
      ownerEmail: email,
      ownerName: customerName || email,
      planKey,
    });
  }

  const actorEmail = await getAuthenticatedAdminEmail(req);
  await addAdminAuditEntry({
    action: 'subscription.grant',
    actorEmail: actorEmail || 'admin-session',
    summary: `Plano ${PLAN_DEFINITIONS[planKey].shortLabel} concedido para ${email}`,
    targetEmail: email,
    metadata: { planKey, expiresAt },
  });

  return NextResponse.json({ ok: true, record });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: 'E-mail é obrigatório.' }, { status: 400 });
  }

  const record = await revokeSubscriptionByEmail(email);
  if (!record) {
    return NextResponse.json({ ok: false, error: 'Assinatura não encontrada.' }, { status: 404 });
  }

  const actorEmail = await getAuthenticatedAdminEmail(req);
  await addAdminAuditEntry({
    action: 'subscription.revoke',
    actorEmail: actorEmail || 'admin-session',
    summary: `Acesso revogado de ${email}`,
    targetEmail: email,
  });

  return NextResponse.json({ ok: true, record });
}

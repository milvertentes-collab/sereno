import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getAuthenticatedUserEmail } from '@/lib/authenticatedUser';
import {
  acceptSeatInvite,
  addSeatMember,
  ensureSeatGroup,
  getSeatGroupByMemberEmail,
  getSeatGroupByOwnerEmail,
  removeSeatMember,
} from '@/lib/subscriptionSeatGroupStore';
import { getSubscriptionByEmail } from '@/lib/subscriptionStore';
import { getPlanDefinition } from '@/lib/subscriptionPlans';

export async function GET(req: NextRequest) {
  const email = await getAuthenticatedUserEmail(req);
  if (!email) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const ownedGroup = await getSeatGroupByOwnerEmail(email);
  const memberGroup = ownedGroup || (await getSeatGroupByMemberEmail(email));

  return NextResponse.json({
    ok: true,
    group: memberGroup,
    isOwner: Boolean(ownedGroup),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const email = String(user?.email || '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = String(body?.action || '').trim();
  const displayName =
    String(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '').trim() || email;

  if (action === 'ensure-owner-group') {
    const subscription = await getSubscriptionByEmail(email);
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ ok: false, error: 'Assinatura ativa não encontrada.' }, { status: 400 });
    }

    const plan = getPlanDefinition(subscription.planKey);
    if (plan.seatLimit <= 1) {
      return NextResponse.json({ ok: false, error: 'Este plano não possui vagas compartilhadas.' }, { status: 400 });
    }

    const group = await ensureSeatGroup({
      ownerEmail: email,
      ownerName: subscription.customerName || displayName,
      planKey: subscription.planKey,
    });
    return NextResponse.json({ ok: true, group });
  }

  if (action === 'invite-member') {
    const group = await getSeatGroupByOwnerEmail(email);
    if (!group) {
      return NextResponse.json({ ok: false, error: 'Grupo do titular não encontrado.' }, { status: 404 });
    }

    try {
      const updated = await addSeatMember({
        ownerEmail: email,
        memberEmail: String(body?.memberEmail || '').trim().toLowerCase(),
        memberName: String(body?.memberName || '').trim(),
        status: 'invited',
      });
      return NextResponse.json({ ok: true, group: updated });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível convidar.' }, { status: 400 });
    }
  }

  if (action === 'join-by-code') {
    const inviteCode = String(body?.inviteCode || '').trim().toUpperCase();
    if (!inviteCode) {
      return NextResponse.json({ ok: false, error: 'Código do convite é obrigatório.' }, { status: 400 });
    }

    try {
      const group = await acceptSeatInvite({
        inviteCode,
        memberEmail: email,
        memberName: displayName,
      });
      return NextResponse.json({ ok: true, group });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível entrar no plano compartilhado.' }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const email = await getAuthenticatedUserEmail(req);
  if (!email) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const memberEmail = req.nextUrl.searchParams.get('memberEmail')?.trim().toLowerCase();
  if (!memberEmail) {
    return NextResponse.json({ ok: false, error: 'memberEmail é obrigatório.' }, { status: 400 });
  }

  try {
    const group = await removeSeatMember({ ownerEmail: email, memberEmail });
    return NextResponse.json({ ok: true, group });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível remover o membro.' }, { status: 400 });
  }
}


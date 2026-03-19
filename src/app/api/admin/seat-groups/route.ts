import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminEmail, isAdminAuthenticated } from '@/lib/adminAuth';
import { addAdminAuditEntry } from '@/lib/adminAuditStore';
import { BillingPlanKey, PLAN_DEFINITIONS } from '@/lib/subscriptionPlans';
import { addSeatMember, ensureSeatGroup, getSeatGroupByOwnerEmail, listSeatGroups, removeSeatMember } from '@/lib/subscriptionSeatGroupStore';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const ownerEmail = req.nextUrl.searchParams.get('ownerEmail')?.trim().toLowerCase();
  if (ownerEmail) {
    const group = await getSeatGroupByOwnerEmail(ownerEmail);
    return NextResponse.json({ ok: true, group });
  }

  const groups = await listSeatGroups();
  return NextResponse.json({ ok: true, groups });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const ownerEmail = String(body?.ownerEmail || '').trim().toLowerCase();
  const ownerName = String(body?.ownerName || '').trim() || ownerEmail;
  const planKey = body?.planKey as BillingPlanKey | undefined;
  const memberEmail = String(body?.memberEmail || '').trim().toLowerCase();
  const memberName = String(body?.memberName || '').trim() || memberEmail;
  const actorEmail = await getAuthenticatedAdminEmail(req);

  if (!ownerEmail || !planKey || !PLAN_DEFINITIONS[planKey]) {
    return NextResponse.json({ ok: false, error: 'Owner e plano são obrigatórios.' }, { status: 400 });
  }

  await ensureSeatGroup({ ownerEmail, ownerName, planKey });

  if (memberEmail) {
    try {
      const group = await addSeatMember({
        ownerEmail,
        memberEmail,
        memberName,
        status: body?.status === 'active' ? 'active' : 'invited',
      });
      await addAdminAuditEntry({
        action: 'seat.member.add',
        actorEmail: actorEmail || 'admin-session',
        summary: `Membro adicionado ao grupo de ${ownerEmail}`,
        targetEmail: memberEmail,
        metadata: { ownerEmail, planKey },
      });
      return NextResponse.json({ ok: true, group });
    } catch (error: any) {
      return NextResponse.json({ ok: false, error: error?.message || 'Não foi possível adicionar o membro.' }, { status: 400 });
    }
  }

  const group = await getSeatGroupByOwnerEmail(ownerEmail);
  return NextResponse.json({ ok: true, group });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const ownerEmail = req.nextUrl.searchParams.get('ownerEmail')?.trim().toLowerCase();
  const memberEmail = req.nextUrl.searchParams.get('memberEmail')?.trim().toLowerCase();
  if (!ownerEmail || !memberEmail) {
    return NextResponse.json({ ok: false, error: 'Owner e membro são obrigatórios.' }, { status: 400 });
  }

  try {
    const group = await removeSeatMember({ ownerEmail, memberEmail });
    const actorEmail = await getAuthenticatedAdminEmail(req);
    await addAdminAuditEntry({
      action: 'seat.member.remove',
      actorEmail: actorEmail || 'admin-session',
      summary: `Membro removido do grupo de ${ownerEmail}`,
      targetEmail: memberEmail,
      metadata: { ownerEmail },
    });
    return NextResponse.json({ ok: true, group });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Não foi possível remover o membro.' }, { status: 400 });
  }
}

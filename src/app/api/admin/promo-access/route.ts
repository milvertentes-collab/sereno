import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminEmail, isAdminAuthenticated } from '@/lib/adminAuth';
import { addBroadcast, BroadcastItem, removeBroadcast, updateBroadcast } from '@/lib/broadcastStore';
import { addAdminAuditEntry } from '@/lib/adminAuditStore';
import { PromoAudience, getPromoCampaignById, listPromoAccessCampaigns, removePromoAccessCampaign, updatePromoAccessCampaign, upsertPromoAccessCampaign } from '@/lib/promoAccessStore';
import { sendPushToAudience } from '@/lib/pushSend';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const campaigns = await listPromoAccessCampaigns();
  return NextResponse.json({ ok: true, campaigns });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = String(body?.id || '').trim() || randomUUID();
  const title = String(body?.title || '').trim();
  const durationDays = Number(body?.durationDays || 0);
  const audience = ['email', 'women', 'men'].includes(body?.audience) ? body.audience as PromoAudience : 'all';
  const targetEmail = String(body?.targetEmail || '').trim().toLowerCase();
  const startsAt = String(body?.startsAt || '').trim();
  const active = body?.active !== false;

  if (!title || !durationDays || durationDays <= 0 || !startsAt) {
    return NextResponse.json({ ok: false, error: 'Título, duração e início são obrigatórios.' }, { status: 400 });
  }
  if (audience === 'email' && !targetEmail) {
    return NextResponse.json({ ok: false, error: 'Informe o e-mail alvo para campanha individual.' }, { status: 400 });
  }

  const startDate = new Date(startsAt);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ ok: false, error: 'Data de início inválida.' }, { status: 400 });
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  const actorEmail = await getAuthenticatedAdminEmail(req);

  const campaign = await upsertPromoAccessCampaign({
    id,
    title,
    durationDays,
    audience,
    targetEmail: audience === 'email' ? targetEmail : undefined,
    grantedByEmail: actorEmail || 'admin-session',
    startsAt: startDate.toISOString(),
    endsAt: endDate.toISOString(),
    active,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const message = `${title} • ${durationDays} dias de acesso Pro promocional.`;
  const broadcastPayload: BroadcastItem = {
    id: `promo-access-${campaign.id}`,
    title: '🎁 Promoção especial liberada',
    body: message,
    createdAt: new Date().toISOString(),
    audience,
    targetEmail: audience === 'email' ? targetEmail : undefined,
    actionTab: 'login',
    actionParams: {
      openPaywall: true,
      promoAccessCampaignId: campaign.id,
      promoAccessEndsAt: campaign.endsAt,
      promoAccessDays: durationDays,
    },
    source: 'custom',
    active,
    startsAt: campaign.startsAt,
    sendPush: true,
    pushDeliveredAt: null,
  };

  if (String(body?.id || '').trim()) {
    await updateBroadcast(`promo-access-${campaign.id}`, broadcastPayload);
  } else {
    await addBroadcast(broadcastPayload);
  }

  let pushResult = { sent: 0, total: 0 };
  if (startDate.getTime() <= Date.now()) {
    try {
      pushResult = await sendPushToAudience(
        { title: '🎁 Promoção especial liberada', body: message, url: '/' },
        audience === 'all'
          ? { type: 'all' }
          : audience === 'email'
            ? { type: 'email', email: targetEmail }
            : { type: audience }
      );
      await updateBroadcast(`promo-access-${campaign.id}`, { pushDeliveredAt: new Date().toISOString() });
    } catch {
      pushResult = { sent: 0, total: 0 };
    }
  }

  await addAdminAuditEntry({
    action: String(body?.id || '').trim() ? 'promo.update' : 'promo.create',
    actorEmail: actorEmail || 'admin-session',
    summary: String(body?.id || '').trim() ? `Promoção atualizada: ${title}` : `Promoção criada: ${title}`,
    metadata: { id: campaign.id, audience, durationDays, startsAt: campaign.startsAt, endsAt: campaign.endsAt },
  });

  return NextResponse.json({ ok: true, campaign, pushResult });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = String(body?.id || '').trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID da campanha é obrigatório.' }, { status: 400 });
  }

  const existing = await getPromoCampaignById(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: 'Campanha não encontrada.' }, { status: 404 });
  }

  const next = await updatePromoAccessCampaign(id, {
    title: body?.title ? String(body.title).trim() : existing.title,
    durationDays: body?.durationDays ? Number(body.durationDays) : existing.durationDays,
    audience: ['email', 'women', 'men'].includes(body?.audience) ? body.audience as PromoAudience : existing.audience,
    targetEmail: body?.audience === 'email' ? String(body?.targetEmail || '').trim().toLowerCase() : body?.audience ? undefined : existing.targetEmail,
    startsAt: body?.startsAt ? String(body.startsAt).trim() : existing.startsAt,
    endsAt: body?.endsAt ? String(body.endsAt).trim() : existing.endsAt,
    active: typeof body?.active === 'boolean' ? body.active : existing.active,
  });

  if (!next) {
    return NextResponse.json({ ok: false, error: 'Não foi possível atualizar a campanha.' }, { status: 500 });
  }

  await updateBroadcast(`promo-access-${id}`, {
    body: `${next.title} • ${next.durationDays} dias de acesso Pro promocional.`,
    startsAt: next.startsAt,
    active: next.active,
    targetEmail: next.targetEmail,
    actionParams: {
      openPaywall: true,
      promoAccessCampaignId: next.id,
      promoAccessEndsAt: next.endsAt,
      promoAccessDays: next.durationDays,
    },
  });

  const actorEmail = await getAuthenticatedAdminEmail(req);
  await addAdminAuditEntry({
    action: next.active ? 'promo.update' : 'promo.deactivate',
    actorEmail: actorEmail || 'admin-session',
    summary: next.active ? `Promoção atualizada: ${next.title}` : `Promoção desativada: ${next.title}`,
    metadata: { id: next.id },
  });

  return NextResponse.json({ ok: true, campaign: next });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID da campanha é obrigatório.' }, { status: 400 });
  }

  const removed = await removePromoAccessCampaign(id);
  if (!removed) {
    return NextResponse.json({ ok: false, error: 'Campanha não encontrada.' }, { status: 404 });
  }

  await removeBroadcast(`promo-access-${id}`);

  const actorEmail = await getAuthenticatedAdminEmail(req);
  await addAdminAuditEntry({
    action: 'promo.delete',
    actorEmail: actorEmail || 'admin-session',
    summary: `Promoção excluída: ${removed.title}`,
    metadata: { id: removed.id },
  });

  return NextResponse.json({ ok: true, campaign: removed });
}

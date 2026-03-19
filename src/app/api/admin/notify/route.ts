import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminEmail, isAdminAuthenticated } from '@/lib/adminAuth';
import { addBroadcast, BroadcastItem, readBroadcasts, removeBroadcast, updateBroadcast } from '@/lib/broadcastStore';
import { addAdminAuditEntry } from '@/lib/adminAuditStore';
import { sendPushToAudience } from '@/lib/pushSend';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const items = await readBroadcasts();
  return NextResponse.json({
    ok: true,
    items: items.filter((item) => item.source === 'custom').slice(0, 100),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = String(body?.id || '').trim() || randomUUID();
  const title = body?.title?.trim();
  const message = body?.body?.trim();
  const audience = ['email', 'women', 'men'].includes(body?.audience) ? body.audience : 'all';
  const targetEmail = body?.targetEmail?.trim() || '';
  const actionTab = body?.actionTab?.trim() || undefined;
  const actionParams = body?.actionParams && typeof body.actionParams === 'object' ? body.actionParams : undefined;
  const linkUrl = body?.linkUrl?.trim() || undefined;
  const sendPush = body?.sendPush !== false;
  const startsAt = body?.startsAt ? String(body.startsAt).trim() : null;
  const active = body?.active !== false;

  if (!title || !message) {
    return NextResponse.json({ ok: false, error: 'Título e mensagem são obrigatórios.' }, { status: 400 });
  }
  if (audience === 'email' && !targetEmail) {
    return NextResponse.json({ ok: false, error: 'Informe o e-mail do destinatário.' }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const shouldSendNow = !startsAt || new Date(startsAt).getTime() <= Date.now();

  const payload: BroadcastItem = {
    id,
    title,
    body: message,
    createdAt,
    startsAt,
    active,
    audience,
    targetEmail: audience === 'email' ? targetEmail : undefined,
    actionTab,
    actionParams,
    linkUrl,
    sendPush,
    pushDeliveredAt: null,
    source: 'custom',
  };

  if (String(body?.id || '').trim()) {
    await updateBroadcast(id, payload);
  } else {
    await addBroadcast(payload);
  }

  let pushResult = { sent: 0, total: 0 };
  if (sendPush && shouldSendNow) {
    pushResult = await sendPushToAudience(
      { title, body: message, url: '/' },
      audience === 'all'
        ? { type: 'all' }
        : audience === 'email'
          ? { type: 'email', email: targetEmail }
          : { type: audience }
    );
    await updateBroadcast(id, { pushDeliveredAt: new Date().toISOString() });
  }

  const actorEmail = await getAuthenticatedAdminEmail(req);
  await addAdminAuditEntry({
    action: String(body?.id || '').trim() ? 'notify.update' : 'notify.create',
    actorEmail: actorEmail || 'admin-session',
    summary: String(body?.id || '').trim() ? `Aviso atualizado: ${title}` : `Aviso criado: ${title}`,
    metadata: {
      id,
      audience,
      startsAt,
      sendPush,
      pushSentNow: shouldSendNow && sendPush,
    },
  });

  return NextResponse.json({ ok: true, id, pushResult, scheduled: !shouldSendNow, item: payload });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID do aviso é obrigatório.' }, { status: 400 });
  }

  await removeBroadcast(id);
  const actorEmail = await getAuthenticatedAdminEmail(req);
  await addAdminAuditEntry({
    action: 'notify.delete',
    actorEmail: actorEmail || 'admin-session',
    summary: `Aviso excluído: ${id}`,
    metadata: { id },
  });

  return NextResponse.json({ ok: true, id });
}

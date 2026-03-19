import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminEmail, isAdminAuthenticated } from '@/lib/adminAuth';
import { addAdminAuditEntry } from '@/lib/adminAuditStore';
import { getLifetimeOfferState } from '@/lib/lifetimeOffer';
import { getStoredLifetimeOfferWindow, updateStoredLifetimeOfferWindow } from '@/lib/lifetimeOfferStore';
import { removeBroadcast, upsertBroadcast } from '@/lib/broadcastStore';
import { sendPushToAudience } from '@/lib/pushSend';

const LIFETIME_BROADCAST_ID = 'system-lifetime-offer';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const storedConfig = await getStoredLifetimeOfferWindow();
  const storedState = getLifetimeOfferState(new Date(), storedConfig);

  if (storedConfig.enabled && storedState.hasEnded) {
    const normalizedConfig = await updateStoredLifetimeOfferWindow({
      enabled: false,
      startsAt: null,
      endsAt: null,
    });
    const normalizedState = getLifetimeOfferState(new Date(), normalizedConfig);
    return NextResponse.json({ ok: true, config: normalizedConfig, state: normalizedState });
  }

  return NextResponse.json({ ok: true, config: storedConfig, state: storedState });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const previousConfig = await getStoredLifetimeOfferWindow();
  const previousState = getLifetimeOfferState(new Date(), previousConfig);
  const body = await req.json().catch(() => null);
  const config = await updateStoredLifetimeOfferWindow({
    enabled: Boolean(body?.enabled),
    startsAt: body?.startsAt || null,
    endsAt: body?.endsAt || null,
  });
  const state = getLifetimeOfferState(new Date(), config);

  const campaignChanged =
    previousConfig.enabled !== config.enabled ||
    previousConfig.startsAt !== config.startsAt ||
    previousConfig.endsAt !== config.endsAt;

  let broadcastAdded = false;
  let pushResult = { sent: 0, total: 0 };
  let pushError: string | null = null;

  if (state.isActive) {
    const title = '💎 Campanha do Vitalício aberta';
    const bodyText = 'O Acesso Vitalício Individual está aberto por tempo limitado. Se fizer sentido para você, esta é a janela ativa para garantir essa condição especial.';
    await upsertBroadcast({
      id: LIFETIME_BROADCAST_ID,
      title,
      body: bodyText,
      createdAt: new Date().toISOString(),
      audience: 'all',
      actionTab: 'login',
      actionParams: {
        openPaywall: true,
        paywallReason: {
          title: 'Acesso Vitalício Individual 💎',
          desc: 'A campanha do vitalício está aberta por tempo limitado. Veja as regras e as condições especiais enquanto a janela estiver ativa.',
        },
      },
      source: 'lifetime_offer',
    });
    broadcastAdded = true;
    if (!previousState.isActive || campaignChanged) {
      try {
        pushResult = await sendPushToAudience({ title, body: bodyText, url: '/' }, { type: 'all' });
      } catch (error: any) {
        pushError = error?.message || 'Falha ao enviar push.';
      }
    }
  } else {
    await removeBroadcast(LIFETIME_BROADCAST_ID);
  }

  const actorEmail = await getAuthenticatedAdminEmail(req);
  await addAdminAuditEntry({
    action: 'lifetime.offer.update',
    actorEmail: actorEmail || 'admin-session',
    summary: state.isActive ? 'Campanha vitalícia ativada/atualizada' : 'Campanha vitalícia desligada',
    metadata: { enabled: config.enabled, startsAt: config.startsAt, endsAt: config.endsAt },
  });

  return NextResponse.json({ ok: true, config, state, broadcastAdded, pushResult, pushError });
}

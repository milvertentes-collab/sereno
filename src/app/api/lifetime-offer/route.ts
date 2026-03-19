import { NextRequest, NextResponse } from 'next/server';
import { getLifetimeOfferState, LifetimeOfferWindow } from '@/lib/lifetimeOffer';
import { getStoredLifetimeOfferWindow, updateStoredLifetimeOfferWindow } from '@/lib/lifetimeOfferStore';

export async function GET() {
  const config = await getStoredLifetimeOfferWindow();
  const state = getLifetimeOfferState(new Date(), config);
  return NextResponse.json({
    enabled: config.enabled,
    startsAt: config.startsAt,
    endsAt: config.endsAt,
    isActive: state.isActive,
    hasStarted: state.hasStarted,
    hasEnded: state.hasEnded,
    msRemaining: state.msRemaining,
  });
}

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.SERENO_ADMIN_SECRET;
  const receivedSecret = req.headers.get('x-sereno-admin-secret');

  if (expectedSecret && receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const payload: LifetimeOfferWindow = {
    enabled: Boolean(body?.enabled),
    startsAt: body?.startsAt || null,
    endsAt: body?.endsAt || null,
  };

  const saved = await updateStoredLifetimeOfferWindow(payload);
  const state = getLifetimeOfferState(new Date(), saved);

  return NextResponse.json({
    ok: true,
    config: saved,
    state: {
      isActive: state.isActive,
      hasStarted: state.hasStarted,
      hasEnded: state.hasEnded,
      msRemaining: state.msRemaining,
    },
  });
}

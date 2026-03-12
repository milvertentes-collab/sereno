import { NextRequest, NextResponse } from 'next/server';
import { upsertSub } from '@/lib/pushStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sub = body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ ok: false, error: 'invalid_subscription' }, { status: 400 });
    }

    await upsertSub({
      endpoint: sub.endpoint,
      keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      birthdate: body?.birthdate,
      reminders: body?.reminders || {},
      capsules: Array.isArray(body?.capsules) ? body.capsules : [],
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

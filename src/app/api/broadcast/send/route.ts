import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { addBroadcast } from '@/lib/broadcastStore';
import { readSubs, removeSub } from '@/lib/pushStore';
import { getPushDispatchSecret, getVapidConfig } from '@/lib/vapidConfig';

export async function POST(req: NextRequest) {
  try {
    const { publicKey, privateKey, subject } = getVapidConfig();
    const secret = getPushDispatchSecret();
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const auth = req.headers.get('x-dispatch-secret');
    if (auth !== secret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const body = await req.json();
    const title = String(body?.title || '').trim();
    const message = String(body?.message || '').trim();
    if (!title || !message) return NextResponse.json({ ok: false, error: 'title_message_required' }, { status: 400 });

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await addBroadcast({ id, title, body: message, createdAt });

    const subs = await readSubs();
    let sent = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(s as any, JSON.stringify({
          title: `📢 ${title}`,
          body: message,
          url: '/',
        }));
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await removeSub(s.endpoint);
      }
    }

    return NextResponse.json({ ok: true, id, sent });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

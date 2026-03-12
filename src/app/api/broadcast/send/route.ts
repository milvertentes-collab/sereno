import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { addBroadcast } from '@/lib/broadcastStore';
import { readSubs, removeSub } from '@/lib/pushStore';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJar0t2x5oCuEHbokX5OnPoruHVuDEgG-vUSEOYnRd5j_M4SnH8xjTADJR5nMi5K5Vyvfl0O-rDFRMqWc-32Sl4';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'z0LZFpu1zwIurQF_8kqYTwJbHvj87NoRLcS7cFbu-o8';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@pontewebstudio.com.br';
const SECRET = process.env.PUSH_DISPATCH_SECRET || 'sereno-local-secret';

webpush.setVapidDetails(SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('x-dispatch-secret');
    if (auth !== SECRET) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

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

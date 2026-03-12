import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { readSubs, removeSub } from '@/lib/pushStore';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BJar0t2x5oCuEHbokX5OnPoruHVuDEgG-vUSEOYnRd5j_M4SnH8xjTADJR5nMi5K5Vyvfl0O-rDFRMqWc-32Sl4';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'z0LZFpu1zwIurQF_8kqYTwJbHvj87NoRLcS7cFbu-o8';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contato@pontewebstudio.com.br';
const DISPATCH_SECRET = process.env.PUSH_DISPATCH_SECRET || 'sereno-local-secret';

webpush.setVapidDetails(SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

function hhmm(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('x-dispatch-secret');
    if (auth !== DISPATCH_SECRET) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const now = new Date();
    const today = { d: now.getDate(), m: now.getMonth() + 1 };
    const timeNow = hhmm(now);

    const subs = await readSubs();
    let sent = 0;

    for (const s of subs) {
      let payload: any = null;
      const r = s.reminders || {};

      if (s.birthdate) {
        const [_, bm, bd] = s.birthdate.split('-').map(Number);
        if (bm === today.m && bd === today.d) {
          payload = { title: '🎉 Feliz Aniversário!', body: 'Hoje o dia é seu. Que seja leve e especial! ✨', url: '/' };
        }
      }

      if (!payload) {
        const capsule = (s.capsules || []).find((c: any) => {
          if (c?.type !== 'futuro' || !c?.openAt) return false;
          const t = new Date(c.openAt).getTime();
          const diff = now.getTime() - t;
          return diff >= 0 && diff < 60 * 1000;
        });
        if (capsule) {
          payload = { title: '🕰️ Cápsula pronta para abrir', body: `Sua cápsula "${capsule.title || 'Mensagem'}" já pode ser aberta.`, url: '/' };
        }
      }

      if (!payload) {
        const checks: Array<[string, string, string]> = [
          ['moodReminder', 'moodTime', '📊 Hora de registrar seu humor!'],
          ['breathingReminder', 'breathingTime', '🌬️ Que tal uma pausa para respirar?'],
          ['diaryReminder', 'diaryTime', '📓 Hora do diário de emoções!'],
          ['meditationReminder', 'meditationTime', '🧘 Pausa rápida para meditar.'],
          ['gratitudeReminder', 'gratitudeTime', '🙏 Registre 1 gratidão de hoje.'],
          ['sleepReminder', 'sleepTime', '🌙 Hora de desacelerar para dormir melhor.'],
          ['missionsReminder', 'missionsTime', '🎯 Avance uma missão de hoje.'],
          ['microtasksReminder', 'microtasksTime', '🌿 Faça uma microtarefa de 5 minutos.'],
        ];

        for (const [flag, tk, text] of checks) {
          if (r?.[flag] && r?.[tk] === timeNow) {
            payload = { title: 'Sereno - Lembrete', body: text, url: '/' };
            break;
          }
        }

        if (!payload && r?.healthySelfReminder && r?.healthySelfTime === timeNow) {
          payload = { title: '💬 Eu Mais Saudável', body: 'Lembre-se: você já superou dias difíceis antes.', url: '/' };
        }
      }

      if (!payload) continue;

      try {
        await webpush.sendNotification(s as any, JSON.stringify(payload));
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await removeSub(s.endpoint);
        }
      }
    }

    return NextResponse.json({ ok: true, sent });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

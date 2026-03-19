import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { readSubs, removeSub } from '@/lib/pushStore';
import { getPushDispatchSecret, getVapidConfig } from '@/lib/vapidConfig';

function hhmm(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export async function POST(req: NextRequest) {
  try {
    const { publicKey, privateKey, subject } = getVapidConfig();
    const dispatchSecret = getPushDispatchSecret();
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const auth = req.headers.get('x-dispatch-secret');
    if (auth !== dispatchSecret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

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

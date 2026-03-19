import webpush from 'web-push';
import { readSubs, removeSub } from './pushStore';
import { getVapidConfig } from './vapidConfig';

const matchesGenderAudience = (sex: string | undefined, audience: 'women' | 'men') => {
  const normalized = (sex || '').trim().toLowerCase();
  if (audience === 'women') {
    return ['mulher', 'mulher_trans', 'lesbica'].includes(normalized);
  }
  return ['homem', 'homem_trans', 'gay'].includes(normalized);
};

export async function sendPushToAudience(
  payload: { title: string; body: string; url?: string },
  audience: { type: 'all' } | { type: 'email'; email: string } | { type: 'women' | 'men' }
) {
  const { publicKey, privateKey, subject } = getVapidConfig();
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const subs = await readSubs();
  const filtered = audience.type === 'all'
    ? subs
    : audience.type === 'email'
      ? subs.filter((sub) => (sub.email || '').trim().toLowerCase() === audience.email.trim().toLowerCase())
      : subs.filter((sub) => matchesGenderAudience(sub.sex, audience.type));

  let sent = 0;
  for (const sub of filtered) {
    try {
      await webpush.sendNotification(sub as any, JSON.stringify(payload));
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await removeSub(sub.endpoint);
      }
    }
  }
  return { sent, total: filtered.length };
}

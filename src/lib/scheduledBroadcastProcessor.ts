import { readBroadcasts, updateBroadcast, type BroadcastItem } from './broadcastStore';
import { sendPushToAudience } from './pushSend';

function isDue(item: BroadcastItem, nowTs: number) {
  if (item.active === false) return false;
  if (!item.startsAt) return true;
  const startsAt = new Date(item.startsAt).getTime();
  return !Number.isNaN(startsAt) && startsAt <= nowTs;
}

async function sendBroadcastPush(item: BroadcastItem) {
  return sendPushToAudience(
    { title: item.title, body: item.body, url: '/' },
    item.audience === 'all' || !item.audience
      ? { type: 'all' }
      : item.audience === 'email'
        ? { type: 'email', email: String(item.targetEmail || '').trim().toLowerCase() }
        : { type: item.audience }
  );
}

export async function processScheduledBroadcasts() {
  const data = await readBroadcasts();
  const nowTs = Date.now();
  const processed: Array<{ id: string; sent: number; total: number }> = [];

  for (const item of data) {
    if (!isDue(item, nowTs)) continue;
    if (!item.sendPush || item.pushDeliveredAt) continue;

    try {
      const result = await sendBroadcastPush(item);
      await updateBroadcast(item.id, { pushDeliveredAt: new Date().toISOString() });
      processed.push({ id: item.id, sent: result.sent, total: result.total });
    } catch {
      // leave pending to retry on next cron cycle
    }
  }

  const visible = (await readBroadcasts()).filter((item) => isDue(item, Date.now()));
  return { processed, visible };
}

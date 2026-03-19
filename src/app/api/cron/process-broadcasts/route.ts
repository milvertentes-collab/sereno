import { NextRequest, NextResponse } from 'next/server';
import { processScheduledBroadcasts } from '@/lib/scheduledBroadcastProcessor';

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET || '';
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  const authHeader = req.headers.get('authorization') || '';
  return Boolean(secret) && authHeader === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { processed, visible } = await processScheduledBroadcasts();
  return NextResponse.json({
    ok: true,
    processedCount: processed.length,
    processed,
    visibleCount: visible.length,
  });
}

import { NextResponse } from 'next/server';
import { processScheduledBroadcasts } from '@/lib/scheduledBroadcastProcessor';

export async function GET() {
  try {
    const { visible } = await processScheduledBroadcasts();
    return NextResponse.json({ ok: true, items: visible.slice(0, 50) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

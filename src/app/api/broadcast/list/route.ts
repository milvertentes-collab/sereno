import { NextResponse } from 'next/server';
import { readBroadcasts } from '@/lib/broadcastStore';

export async function GET() {
  try {
    const data = await readBroadcasts();
    return NextResponse.json({ ok: true, items: data.slice(0, 50) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { receiveRandomHopeMessage } from '@/lib/hopeWallStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId = String(body?.deviceId || '').trim();
    const accountId = String(body?.accountId || '').trim();

    if (!deviceId) return NextResponse.json({ ok: false, error: 'device_id_required' }, { status: 400 });

    const item = await receiveRandomHopeMessage({ accountId, deviceId });
    if (!item) {
      return NextResponse.json({ ok: false, error: 'no_messages_available' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'failed' }, { status: 500 });
  }
}

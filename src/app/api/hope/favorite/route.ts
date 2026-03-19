import { NextRequest, NextResponse } from 'next/server';
import { setHopeFavorite } from '@/lib/hopeWallStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messageId = String(body?.messageId || '').trim();
    const deviceId = String(body?.deviceId || '').trim();
    const accountId = String(body?.accountId || '').trim();
    const favorite = Boolean(body?.favorite);

    if (!messageId) return NextResponse.json({ ok: false, error: 'message_id_required' }, { status: 400 });
    if (!deviceId) return NextResponse.json({ ok: false, error: 'device_id_required' }, { status: 400 });

    const result = await setHopeFavorite({ messageId, deviceId, accountId, favorite });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'failed' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getHopeHistory } from '@/lib/hopeWallStore';

export async function GET(req: NextRequest) {
  try {
    const deviceId = String(req.nextUrl.searchParams.get('deviceId') || '').trim();
    const accountId = String(req.nextUrl.searchParams.get('accountId') || '').trim();

    if (!deviceId) return NextResponse.json({ ok: false, error: 'device_id_required' }, { status: 400 });

    const items = await getHopeHistory({ accountId, deviceId });
    return NextResponse.json({ ok: true, items });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'failed' }, { status: 500 });
  }
}

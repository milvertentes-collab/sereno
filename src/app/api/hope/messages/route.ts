import { NextRequest, NextResponse } from 'next/server';
import { createHopeMessage, listHopeWallMessages } from '@/lib/hopeWallStore';

export async function GET(req: NextRequest) {
  const limit = Math.max(1, Math.min(36, Number(req.nextUrl.searchParams.get('limit') || 24)));
  const items = await listHopeWallMessages(limit);
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body?.text || '').trim();
    const deviceId = String(body?.deviceId || '').trim();
    const accountId = String(body?.accountId || '').trim();
    const anonymousAlias = String(body?.anonymousAlias || '').trim();

    if (!text) return NextResponse.json({ ok: false, error: 'text_required' }, { status: 400 });
    if (text.length < 10) return NextResponse.json({ ok: false, error: 'text_too_short' }, { status: 400 });
    if (!deviceId) return NextResponse.json({ ok: false, error: 'device_id_required' }, { status: 400 });

    const created = await createHopeMessage({ text, deviceId, accountId, anonymousAlias });
    if (!created.ok) {
      return NextResponse.json({
        ok: false,
        error: created.reason,
        moderationReason: 'moderationReason' in created ? created.moderationReason : undefined,
        retryAfterMs: 'retryAfterMs' in created ? created.retryAfterMs : undefined,
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true, item: created.item });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'failed' }, { status: 500 });
  }
}

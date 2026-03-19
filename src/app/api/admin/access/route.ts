import { NextRequest, NextResponse } from 'next/server';
import { isAllowedAdminEmail } from '@/lib/adminSettings';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: true, allowed: false });
  }

  const allowed = await isAllowedAdminEmail(email);
  return NextResponse.json({ ok: true, allowed });
}

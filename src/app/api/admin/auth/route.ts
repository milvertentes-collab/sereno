import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, createAdminSessionValue } from '@/lib/adminAuth';
import { verifyAdminPassword } from '@/lib/adminSettings';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password || '';

  if (!(await verifyAdminPassword(password))) {
    return NextResponse.json({ ok: false, error: 'Senha inválida.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSessionValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

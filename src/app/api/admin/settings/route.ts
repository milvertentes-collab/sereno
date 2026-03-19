import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdminEmail, isAdminAuthenticated } from '@/lib/adminAuth';
import { addAdminAuditEntry } from '@/lib/adminAuditStore';
import { getAdminSettings, updateAdminSettings } from '@/lib/adminSettings';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const settings = await getAdminSettings();
  return NextResponse.json({
    ok: true,
    adminEmails: settings.adminEmails,
    updatedAt: settings.updatedAt,
    hasPassword: Boolean(settings.passwordHash),
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const adminEmails = Array.isArray(body?.adminEmails)
    ? body.adminEmails.map((email: unknown) => String(email || '').trim().toLowerCase()).filter(Boolean)
    : undefined;
  const newPassword = String(body?.newPassword || '').trim();

  if (adminEmails && adminEmails.length === 0) {
    return NextResponse.json({ ok: false, error: 'Mantenha pelo menos um e-mail de admin.' }, { status: 400 });
  }

  if (body?.newPassword !== undefined && newPassword.length < 6) {
    return NextResponse.json({ ok: false, error: 'A nova senha precisa ter pelo menos 6 caracteres.' }, { status: 400 });
  }

  const settings = await updateAdminSettings({
    adminEmails,
    newPassword: newPassword || undefined,
  });
  const actorEmail = await getAuthenticatedAdminEmail(req);
  await addAdminAuditEntry({
    action: 'admin.settings.update',
    actorEmail: actorEmail || 'admin-session',
    summary: 'Configurações do painel admin atualizadas',
    metadata: {
      adminEmails: settings.adminEmails,
      passwordChanged: Boolean(newPassword),
    },
  });

  return NextResponse.json({
    ok: true,
    adminEmails: settings.adminEmails,
    updatedAt: settings.updatedAt,
  });
}

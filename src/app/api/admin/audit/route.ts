import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { listAdminAuditEntries, removeAdminAuditEntry } from '@/lib/adminAuditStore';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const items = await listAdminAuditEntries();
  return NextResponse.json({ ok: true, items: items.slice(0, 150) });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id')?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'ID do histórico é obrigatório.' }, { status: 400 });
  }

  const removed = await removeAdminAuditEntry(id);
  if (!removed) {
    return NextResponse.json({ ok: false, error: 'Registro não encontrado.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, entry: removed });
}

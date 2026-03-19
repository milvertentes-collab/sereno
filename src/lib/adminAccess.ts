export type AdminLikeAccount = {
  email?: string | null;
  role?: string | null;
  adminAccess?: boolean | null;
};

export function getConfiguredAdminEmails() {
  return String(process.env.NEXT_PUBLIC_SERENO_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAdminAccess(account?: AdminLikeAccount | null, adminEmails: string[] = getConfiguredAdminEmails()) {
  const currentEmail = String(account?.email || '').trim().toLowerCase();
  if (!currentEmail) return false;
  return Boolean(account?.adminAccess) || account?.role === 'admin' || adminEmails.includes(currentEmail);
}

export function buildAdminPreparedAccount<T extends AdminLikeAccount>(account: T, adminEmails: string[] = getConfiguredAdminEmails()) {
  const isAdmin = hasAdminAccess(account, adminEmails);
  return {
    ...account,
    role: isAdmin ? 'admin' : (account.role || 'user'),
    adminAccess: isAdmin,
  };
}

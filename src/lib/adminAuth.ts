import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAllowedAdminEmail } from './adminSettings';

export const ADMIN_COOKIE = 'sereno_admin_session';

function getSecret() {
  return process.env.SERENO_ADMIN_SECRET || 'sereno-admin-local-secret';
}

export function createAdminSessionValue() {
  const date = new Date().toISOString().slice(0, 10);
  return crypto.createHmac('sha256', getSecret()).update(`sereno-admin:${date}`).digest('hex');
}

async function isSupabaseAdminAuthenticated(req?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) return false;

  const authHeader = req?.headers.get('authorization') || req?.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return false;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return false;

  const metadata = data.user.user_metadata || {};
  const appMetadata = data.user.app_metadata || {};
  const email = String(data.user.email || '').trim().toLowerCase();

  return Boolean(appMetadata.admin_access || metadata.admin_access) || appMetadata.role === 'admin' || metadata.role === 'admin' || await isAllowedAdminEmail(email);
}

export async function getAuthenticatedAdminEmail(req?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authHeader = req?.headers.get('authorization') || req?.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.email) return null;
  return String(data.user.email).trim().toLowerCase();
}

export async function isAdminAuthenticated(req?: NextRequest) {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (value === createAdminSessionValue()) return true;
  return isSupabaseAdminAuthenticated(req);
}

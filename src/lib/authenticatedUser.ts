import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export async function getAuthenticatedUser(req?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authHeader = req?.headers.get('authorization') || req?.headers.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function getAuthenticatedUserEmail(req?: NextRequest) {
  const user = await getAuthenticatedUser(req);
  const email = String(user?.email || '').trim().toLowerCase();
  return email || null;
}


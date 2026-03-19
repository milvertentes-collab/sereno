export const SUPABASE_ADMIN_PANEL_SCHEMA_SQL = `
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor_email text not null,
  summary text not null,
  target_email text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id uuid primary key default gen_random_uuid(),
  admin_emails text[] not null default '{}',
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_access_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  duration_days integer not null,
  audience text not null,
  target_email text,
  granted_by_email text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_broadcasts (
  id text primary key,
  title text not null,
  body text not null,
  starts_at timestamptz,
  active boolean not null default true,
  audience text,
  target_email text,
  action_tab text,
  action_params jsonb,
  link_url text,
  send_push boolean not null default false,
  push_delivered_at timestamptz,
  source text not null default 'custom',
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created_at on public.admin_audit_log(created_at desc);
create index if not exists idx_promo_access_campaigns_target_email on public.promo_access_campaigns(target_email);
create index if not exists idx_app_broadcasts_starts_at on public.app_broadcasts(starts_at);
`.trim();

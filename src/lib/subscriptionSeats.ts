import { BillingPlanKey, PlanAccessScope, PlanGroupType, getPlanDefinition } from './subscriptionPlans';

export type SubscriptionSeatMemberRole = 'owner' | 'member';
export type SubscriptionSeatMemberStatus = 'active' | 'invited';

export interface SubscriptionSeatMember {
  id: string;
  email: string;
  name: string;
  role: SubscriptionSeatMemberRole;
  status: SubscriptionSeatMemberStatus;
  invitedAt?: string;
  joinedAt?: string;
}

export interface SubscriptionSeatGroup {
  id: string;
  ownerEmail: string;
  ownerName: string;
  planKey: BillingPlanKey;
  accessScope: PlanAccessScope;
  groupType: PlanGroupType;
  seatLimit: number;
  inviteCode: string;
  members: SubscriptionSeatMember[];
  createdAt: string;
  updatedAt: string;
}

function createInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `seat_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function createSubscriptionSeatGroup(params: {
  ownerEmail: string;
  ownerName: string;
  planKey: BillingPlanKey;
}) {
  const plan = getPlanDefinition(params.planKey);
  const now = new Date().toISOString();
  return {
    id: createId(),
    ownerEmail: params.ownerEmail,
    ownerName: params.ownerName,
    planKey: params.planKey,
    accessScope: plan.accessScope,
    groupType: plan.groupType,
    seatLimit: plan.seatLimit,
    inviteCode: createInviteCode(),
    members: [
      {
        id: createId(),
        email: params.ownerEmail,
        name: params.ownerName,
        role: 'owner',
        status: 'active',
        joinedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  } satisfies SubscriptionSeatGroup;
}

export function ensureOwnerSeat(group: SubscriptionSeatGroup, ownerEmail: string, ownerName: string) {
  const plan = getPlanDefinition(group.planKey);
  const now = new Date().toISOString();
  const ownerIndex = group.members.findIndex((member) => member.role === 'owner');
  const ownerMember: SubscriptionSeatMember = {
    id: ownerIndex >= 0 ? group.members[ownerIndex].id : createId(),
    email: ownerEmail,
    name: ownerName,
    role: 'owner',
    status: 'active',
    joinedAt: ownerIndex >= 0 ? group.members[ownerIndex].joinedAt || now : now,
  };

  const nextMembers = ownerIndex >= 0
    ? group.members.map((member, index) => (index === ownerIndex ? ownerMember : member))
    : [ownerMember, ...group.members];

  return {
    ...group,
    ownerEmail,
    ownerName,
    seatLimit: plan.seatLimit,
    accessScope: plan.accessScope,
    groupType: plan.groupType,
    members: nextMembers,
    updatedAt: now,
  } satisfies SubscriptionSeatGroup;
}

export function getSeatSummary(group: SubscriptionSeatGroup | null) {
  if (!group) {
    return {
      activeSeats: 0,
      invitedSeats: 0,
      remainingSeats: 0,
      occupiedSeats: 0,
    };
  }

  const activeSeats = group.members.filter((member) => member.status === 'active').length;
  const invitedSeats = group.members.filter((member) => member.status === 'invited').length;
  const occupiedSeats = activeSeats + invitedSeats;

  return {
    activeSeats,
    invitedSeats,
    occupiedSeats,
    remainingSeats: Math.max(0, group.seatLimit - occupiedSeats),
  };
}

export const SUPABASE_SUBSCRIPTION_SEATS_SCHEMA_SQL = `
create table if not exists public.subscription_groups (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid,
  owner_email text not null,
  owner_name text,
  plan_key text not null,
  access_scope text not null,
  group_type text not null,
  seat_limit integer not null check (seat_limit >= 1),
  invite_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscription_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.subscription_groups(id) on delete cascade,
  user_id uuid,
  email text not null,
  display_name text,
  role text not null check (role in ('owner','member')),
  status text not null check (status in ('active','invited')),
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, email)
);

create table if not exists public.subscription_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.subscription_groups(id) on delete cascade,
  invite_code text not null,
  email text,
  invited_name text,
  invited_by_email text not null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscription_groups_owner_email on public.subscription_groups(owner_email);
create index if not exists idx_subscription_group_members_group_id on public.subscription_group_members(group_id);
create index if not exists idx_subscription_group_invites_group_id on public.subscription_group_invites(group_id);
`.trim();

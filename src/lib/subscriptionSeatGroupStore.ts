import { randomUUID } from 'crypto';
import { readJsonFile, writeJsonFile } from './serverJsonStore';
import { BillingPlanKey, getPlanDefinition } from './subscriptionPlans';
import { SubscriptionSeatGroup, SubscriptionSeatMember, createSubscriptionSeatGroup, getSeatSummary } from './subscriptionSeats';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabaseAdmin';

const SEAT_GROUPS_FILE = 'subscription-seat-groups.json';

function normalizeEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase();
}

function mapGroupRow(row: any, members: any[]): SubscriptionSeatGroup {
  return {
    id: row.id,
    ownerEmail: row.owner_email,
    ownerName: row.owner_name || row.owner_email,
    planKey: row.plan_key,
    accessScope: row.access_scope,
    groupType: row.group_type,
    seatLimit: row.seat_limit,
    inviteCode: row.invite_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    members: members.map((member) => ({
      id: member.id,
      email: member.email,
      name: member.display_name || member.email,
      role: member.role,
      status: member.status,
      invitedAt: member.invited_at || undefined,
      joinedAt: member.joined_at || undefined,
    })),
  };
}

async function readGroups() {
  return readJsonFile<SubscriptionSeatGroup[]>(SEAT_GROUPS_FILE, []);
}

async function writeGroups(groups: SubscriptionSeatGroup[]) {
  await writeJsonFile(SEAT_GROUPS_FILE, groups);
}

async function listRemoteSeatGroups() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscription_groups')
    .select(`
      id,
      owner_email,
      owner_name,
      plan_key,
      access_scope,
      group_type,
      seat_limit,
      invite_code,
      created_at,
      updated_at,
      subscription_group_members (
        id,
        email,
        display_name,
        role,
        status,
        invited_at,
        joined_at
      )
    `)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return Array.isArray(data)
    ? data.map((row: any) => mapGroupRow(row, Array.isArray(row.subscription_group_members) ? row.subscription_group_members : []))
    : [];
}

async function upsertRemoteSeatGroup(group: SubscriptionSeatGroup) {
  const supabase = getSupabaseAdmin();
  const groupPayload = {
    id: group.id,
    owner_email: normalizeEmail(group.ownerEmail),
    owner_name: group.ownerName,
    plan_key: group.planKey,
    access_scope: group.accessScope,
    group_type: group.groupType,
    seat_limit: group.seatLimit,
    invite_code: group.inviteCode,
    created_at: group.createdAt,
    updated_at: group.updatedAt,
  };

  const { error: groupError } = await supabase
    .from('subscription_groups')
    .upsert(groupPayload, { onConflict: 'id' });

  if (groupError) throw groupError;

  const { error: deleteError } = await supabase
    .from('subscription_group_members')
    .delete()
    .eq('group_id', group.id);

  if (deleteError) throw deleteError;

  if (group.members.length > 0) {
    const memberPayload = group.members.map((member) => ({
      id: member.id,
      group_id: group.id,
      email: normalizeEmail(member.email),
      display_name: member.name,
      role: member.role,
      status: member.status,
      invited_at: member.invitedAt || null,
      joined_at: member.joinedAt || null,
      updated_at: group.updatedAt,
    }));

    const { error: membersError } = await supabase
      .from('subscription_group_members')
      .insert(memberPayload);

    if (membersError) throw membersError;
  }
}

async function ensureRemoteSeeded() {
  const remote = await listRemoteSeatGroups();
  if (remote.length > 0) return remote;

  const local = await readGroups();
  for (const group of local) {
    await upsertRemoteSeatGroup(group);
  }
  return listRemoteSeatGroups();
}

export async function listSeatGroups() {
  return isSupabaseAdminConfigured ? ensureRemoteSeeded() : readGroups();
}

export async function getSeatGroupByOwnerEmail(ownerEmail: string) {
  const email = normalizeEmail(ownerEmail);
  const groups = await listSeatGroups();
  return groups.find((group) => normalizeEmail(group.ownerEmail) === email) || null;
}

export async function getSeatGroupByMemberEmail(memberEmail: string) {
  const email = normalizeEmail(memberEmail);
  const groups = await listSeatGroups();
  return groups.find((group) => group.members.some((member) => normalizeEmail(member.email) === email)) || null;
}

export async function getSeatGroupByInviteCode(inviteCode: string) {
  const normalized = String(inviteCode || '').trim().toUpperCase();
  if (!normalized) return null;
  const groups = await listSeatGroups();
  return groups.find((group) => String(group.inviteCode || '').trim().toUpperCase() === normalized) || null;
}

export async function ensureSeatGroup(params: {
  ownerEmail: string;
  ownerName: string;
  planKey: BillingPlanKey;
}) {
  const email = normalizeEmail(params.ownerEmail);
  const groups = await listSeatGroups();
  const existing = groups.find((group) => normalizeEmail(group.ownerEmail) === email);
  const plan = getPlanDefinition(params.planKey);

  if (existing) {
    const updated: SubscriptionSeatGroup = {
      ...existing,
      ownerEmail: email,
      ownerName: params.ownerName,
      planKey: params.planKey,
      accessScope: plan.accessScope,
      groupType: plan.groupType,
      seatLimit: plan.seatLimit,
      updatedAt: new Date().toISOString(),
    };
    const ownerIndex = updated.members.findIndex((member) => member.role === 'owner');
    const ownerMember: SubscriptionSeatMember = ownerIndex >= 0
      ? { ...updated.members[ownerIndex], email, name: params.ownerName, status: 'active' }
      : {
          id: randomUUID(),
          email,
          name: params.ownerName,
          role: 'owner',
          status: 'active',
          joinedAt: new Date().toISOString(),
        };
    updated.members = ownerIndex >= 0
      ? updated.members.map((member, index) => (index === ownerIndex ? ownerMember : member))
      : [ownerMember, ...updated.members];

    await upsertSeatGroup(updated);
    return updated;
  }

  const created = createSubscriptionSeatGroup({
    ownerEmail: email,
    ownerName: params.ownerName,
    planKey: params.planKey,
  });
  await upsertSeatGroup(created);
  return created;
}

export async function upsertSeatGroup(group: SubscriptionSeatGroup) {
  if (!isSupabaseAdminConfigured) {
    const groups = await readGroups();
    const next = [group, ...groups.filter((item) => item.id !== group.id)];
    await writeGroups(next);
    return group;
  }

  await upsertRemoteSeatGroup(group);
  return group;
}

export async function addSeatMember(params: {
  ownerEmail: string;
  memberEmail: string;
  memberName: string;
  status?: 'active' | 'invited';
}) {
  const group = await getSeatGroupByOwnerEmail(params.ownerEmail);
  if (!group) throw new Error('Grupo de vagas não encontrado.');

  const email = normalizeEmail(params.memberEmail);
  if (!email) throw new Error('E-mail do membro é obrigatório.');
  if (group.members.some((member) => normalizeEmail(member.email) === email)) {
    throw new Error('Esse e-mail já está no grupo.');
  }

  const summary = getSeatSummary(group);
  if (summary.occupiedSeats >= group.seatLimit) {
    throw new Error('Não há vagas disponíveis nesse plano.');
  }

  const next: SubscriptionSeatGroup = {
    ...group,
    updatedAt: new Date().toISOString(),
    members: [
      ...group.members,
      {
        id: randomUUID(),
        email,
        name: params.memberName,
        role: 'member',
        status: params.status || 'invited',
        invitedAt: new Date().toISOString(),
        joinedAt: params.status === 'active' ? new Date().toISOString() : undefined,
      },
    ],
  };

  await upsertSeatGroup(next);
  return next;
}

export async function removeSeatMember(params: { ownerEmail: string; memberEmail: string }) {
  const group = await getSeatGroupByOwnerEmail(params.ownerEmail);
  if (!group) throw new Error('Grupo de vagas não encontrado.');
  const email = normalizeEmail(params.memberEmail);
  const nextMembers = group.members.filter((member) => !(member.role !== 'owner' && normalizeEmail(member.email) === email));
  const next: SubscriptionSeatGroup = {
    ...group,
    members: nextMembers,
    updatedAt: new Date().toISOString(),
  };
  await upsertSeatGroup(next);
  return next;
}

export async function acceptSeatInvite(params: {
  inviteCode: string;
  memberEmail: string;
  memberName: string;
}) {
  const group = await getSeatGroupByInviteCode(params.inviteCode);
  if (!group) throw new Error('Código de convite não encontrado.');

  const email = normalizeEmail(params.memberEmail);
  if (!email) throw new Error('E-mail do membro é obrigatório.');

  const existingMemberIndex = group.members.findIndex((member) => normalizeEmail(member.email) === email);

  if (existingMemberIndex >= 0) {
    const existingMember = group.members[existingMemberIndex];
    if (existingMember.role === 'owner') return group;

    const next: SubscriptionSeatGroup = {
      ...group,
      updatedAt: new Date().toISOString(),
      members: group.members.map((member, index) =>
        index === existingMemberIndex
          ? {
              ...member,
              name: params.memberName || member.name,
              status: 'active',
              joinedAt: member.joinedAt || new Date().toISOString(),
            }
          : member,
      ),
    };

    await upsertSeatGroup(next);
    return next;
  }

  const summary = getSeatSummary(group);
  if (summary.occupiedSeats >= group.seatLimit) {
    throw new Error('Não há vagas disponíveis nesse plano.');
  }

  const next: SubscriptionSeatGroup = {
    ...group,
    updatedAt: new Date().toISOString(),
    members: [
      ...group.members,
      {
        id: randomUUID(),
        email,
        name: params.memberName,
        role: 'member',
        status: 'active',
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
      },
    ],
  };

  await upsertSeatGroup(next);
  return next;
}

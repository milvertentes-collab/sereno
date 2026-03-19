import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionByEmail } from '@/lib/subscriptionStore';
import { getPlanDefinition, getPublicPlanLabel } from '@/lib/subscriptionPlans';
import { ensureSeatGroup, getSeatGroupByMemberEmail } from '@/lib/subscriptionSeatGroupStore';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim();
  if (!email) {
    return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
  }

  const record = await getSubscriptionByEmail(email);
  const memberGroup = await getSeatGroupByMemberEmail(email);
  const memberSeat = memberGroup?.members.find((member) => member.email.toLowerCase() === email.toLowerCase() && member.status === 'active');
  const ownerRecord = memberGroup ? await getSubscriptionByEmail(memberGroup.ownerEmail) : null;
  const ownerHasActiveSharedPlan = Boolean(ownerRecord && ownerRecord.accessTier === 'pro' && ownerRecord.status === 'active');
  if ((!record || record.accessTier !== 'pro' || record.status !== 'active') && memberGroup && memberSeat && ownerHasActiveSharedPlan) {
    const plan = getPlanDefinition(memberGroup.planKey);
    return NextResponse.json({
      accessTier: 'pro',
      plan: 'pro',
      planKey: memberGroup.planKey,
      status: 'active',
      billingCycle: plan.billingCycle,
      isLifetime: Boolean(plan.isLifetime),
      activatedAt: memberSeat.joinedAt || memberGroup.updatedAt,
      expiresAt: null,
      planLabel: getPublicPlanLabel(memberGroup.planKey, 'pro'),
      seatLimit: plan.seatLimit,
      accessScope: plan.accessScope,
      groupType: plan.groupType,
      sharedAccess: true,
      sharedOwnerEmail: memberGroup.ownerEmail,
      inviteCode: memberGroup.inviteCode,
    });
  }

  if (!record) {
    const freePlan = getPlanDefinition('free');
    return NextResponse.json({
      accessTier: 'free',
      plan: 'free',
      planKey: 'free',
      status: 'inactive',
      planLabel: getPublicPlanLabel('free', 'free'),
      seatLimit: freePlan.seatLimit,
      accessScope: freePlan.accessScope,
      groupType: freePlan.groupType,
    });
  }

  const plan = getPlanDefinition(record.planKey);
  if (plan.seatLimit > 1 && record.status === 'active') {
    await ensureSeatGroup({
      ownerEmail: email,
      ownerName: record.customerName || email,
      planKey: record.planKey,
    });
  }

  return NextResponse.json({
    accessTier: record.accessTier,
    plan: record.accessTier,
    planKey: record.planKey,
    status: record.status,
    billingCycle: record.billingCycle,
    isLifetime: record.isLifetime,
    activatedAt: record.activatedAt,
    expiresAt: record.expiresAt,
    planLabel: getPublicPlanLabel(record.planKey, record.accessTier),
    seatLimit: plan.seatLimit,
    accessScope: plan.accessScope,
    groupType: plan.groupType,
    sharedAccess: false,
  });
}

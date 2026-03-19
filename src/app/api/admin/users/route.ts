import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { isAllowedAdminEmail } from '@/lib/adminSettings';
import { getApplicablePromoAccess, listPromoAccessCampaigns } from '@/lib/promoAccessStore';
import { getSeatGroupByOwnerEmail } from '@/lib/subscriptionSeatGroupStore';
import { getSubscriptionByEmail } from '@/lib/subscriptionStore';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  const sex = req.nextUrl.searchParams.get('sex')?.trim().toLowerCase() || '';
  if (!email) {
    return NextResponse.json({ ok: false, error: 'E-mail é obrigatório.' }, { status: 400 });
  }

  const subscription = await getSubscriptionByEmail(email);
  const activePromo = await getApplicablePromoAccess({ email, sex });
  const campaigns = await listPromoAccessCampaigns();
  const directPromos = campaigns.filter((item) => item.audience === 'email' && item.targetEmail?.toLowerCase() === email);
  const seatGroup = await getSeatGroupByOwnerEmail(email);
  const adminAccess = await isAllowedAdminEmail(email);

  return NextResponse.json({
    ok: true,
    user: {
      email,
      subscription,
      activePromo,
      directPromos,
      adminAccess,
      seatGroup,
      isLifetime: Boolean(subscription?.isLifetime),
      expiresAt: subscription?.expiresAt || null,
    },
  });
}

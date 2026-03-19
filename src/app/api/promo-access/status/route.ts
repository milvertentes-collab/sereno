import { NextRequest, NextResponse } from 'next/server';
import { getApplicablePromoAccess } from '@/lib/promoAccessStore';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase() || '';
  const sex = req.nextUrl.searchParams.get('sex')?.trim().toLowerCase() || '';

  const campaign = await getApplicablePromoAccess({
    email,
    sex,
    now: new Date(),
  });

  if (!campaign) {
    return NextResponse.json({ ok: true, active: false });
  }

  return NextResponse.json({
    ok: true,
    active: true,
    campaign: {
      id: campaign.id,
      title: campaign.title,
      durationDays: campaign.durationDays,
      audience: campaign.audience,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
    },
  });
}

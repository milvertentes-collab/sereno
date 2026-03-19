export interface LifetimeOfferWindow {
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export function getLifetimeOfferWindow(): LifetimeOfferWindow {
  return {
    enabled: false,
    startsAt: null,
    endsAt: null,
  };
}

export function getLifetimeOfferState(now = new Date(), config = getLifetimeOfferWindow()) {
  const startsAtDate = config.startsAt ? new Date(config.startsAt) : null;
  const endsAtDate = config.endsAt ? new Date(config.endsAt) : null;
  const hasStarted = !startsAtDate || now >= startsAtDate;
  const hasEnded = !!endsAtDate && now > endsAtDate;
  const isActive = Boolean(config.enabled && hasStarted && !hasEnded);
  const msRemaining = isActive && endsAtDate ? Math.max(0, endsAtDate.getTime() - now.getTime()) : 0;

  return {
    ...config,
    startsAtDate,
    endsAtDate,
    hasStarted,
    hasEnded,
    isActive,
    msRemaining,
  };
}

export function formatRemainingTime(msRemaining: number) {
  if (msRemaining <= 0) return 'Encerrado';
  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

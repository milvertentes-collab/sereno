export type SharePlatform = 'whatsapp' | 'instagram' | 'telegram' | 'x' | 'email' | 'copy';

const APP_NAME = 'Sereno';
const APP_URL = 'https://play.google.com/store/apps/details?id=com.sereno.app';

export async function shareText(text: string, platform: SharePlatform) {
  const message = `${text}\n\n⬇️ ${APP_NAME}: ${APP_URL}`;

  if (platform === 'copy') {
    try {
      await navigator.clipboard.writeText(APP_URL);
    } catch {}
    return;
  }

  if (platform === 'instagram') {
    try {
      await navigator.clipboard.writeText(message);
    } catch {}
    window.open('https://www.instagram.com/', '_blank');
    return;
  }

  const url = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(text)}`,
    x: `https://x.com/intent/post?text=${encodeURIComponent(message)}`,
    email: `mailto:?subject=${encodeURIComponent(`${APP_NAME} | Compartilhar`)}&body=${encodeURIComponent(message)}`,
  } as const;

  if (platform in url) {
    window.open(url[platform as keyof typeof url], '_blank');
  }
}

export function buildBadgeShareText(title: string, desc: string) {
  return `🏆 Conquista no ${APP_NAME}: ${title}\n\n${desc}`;
}

export function buildChallengeShareText(title: string, why?: string) {
  return `🎯 Desafio concluído no ${APP_NAME}: ${title}\n\n${why || 'Fechei um ciclo importante de cuidado.'}`;
}

export function buildTrackShareText(title: string, reward: string) {
  return `🧭 Trilha concluída no ${APP_NAME}: ${title}\n\n${reward}`;
}

'use client';

export type BrowserSpeechVoice = 'feminino' | 'masculino';

let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeResolve: ((value: boolean) => void) | null = null;

function hasBrowserSpeech() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

function pickVoice(target: BrowserSpeechVoice) {
  if (!hasBrowserSpeech()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const ptVoices = voices.filter((voice) => /pt(-|_)?br|^pt/i.test(voice.lang || ''));
  const pool = ptVoices.length ? ptVoices : voices;

  const maleHints = ['antonio', 'caio', 'bruno', 'male', 'homem', 'masc'];
  const femaleHints = ['francisca', 'maria', 'luciana', 'female', 'mulher', 'fem'];
  const hints = target === 'masculino' ? maleHints : femaleHints;

  return (
    pool.find((voice) => hints.some((hint) => voice.name.toLowerCase().includes(hint))) ||
    pool.find((voice) => /pt(-|_)?br/i.test(voice.lang || '')) ||
    pool[0] ||
    null
  );
}

export function cancelBrowserSpeech() {
  if (!hasBrowserSpeech()) return;
  window.speechSynthesis.cancel();
  activeUtterance = null;
  if (activeResolve) {
    activeResolve(false);
    activeResolve = null;
  }
}

export async function waitForBrowserVoices(timeoutMs = 1200) {
  if (!hasBrowserSpeech()) return;
  if (window.speechSynthesis.getVoices().length) return;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const timer = window.setTimeout(finish, timeoutMs);
    window.speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timer);
      finish();
    };
  });
}

export async function speakBrowserText(
  text: string,
  options?: {
    voice?: BrowserSpeechVoice;
    volume?: number;
    rate?: number;
    pitch?: number;
  },
) {
  if (!text.trim() || !hasBrowserSpeech()) return false;

  await waitForBrowserVoices();
  cancelBrowserSpeech();

  return new Promise<boolean>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const targetVoice = options?.voice || 'feminino';
    const picked = pickVoice(targetVoice);

    utterance.lang = picked?.lang || 'pt-BR';
    if (picked) utterance.voice = picked;
    utterance.volume = Math.max(0, Math.min(1, options?.volume ?? 0.8));
    utterance.rate = options?.rate ?? 0.96;
    utterance.pitch = options?.pitch ?? (targetVoice === 'feminino' ? 1.02 : 0.94);

    activeUtterance = utterance;
    activeResolve = resolve;

    utterance.onend = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      if (activeResolve === resolve) activeResolve = null;
      resolve(true);
    };
    utterance.onerror = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      if (activeResolve === resolve) activeResolve = null;
      resolve(false);
    };

    window.speechSynthesis.speak(utterance);
  });
}

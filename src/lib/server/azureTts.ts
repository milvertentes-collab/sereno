import { createHash } from 'crypto';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export const AZURE_TTS_MAX_TEXT_LENGTH = 2000;
export const AZURE_TTS_FEMALE_VOICE = 'pt-BR-FranciscaNeural';
export const AZURE_TTS_MALE_VOICE = 'pt-BR-AntonioNeural';

type SupportedVoiceName =
  | typeof AZURE_TTS_FEMALE_VOICE
  | typeof AZURE_TTS_MALE_VOICE;

type InputVoice = 'feminino' | 'masculino' | SupportedVoiceName | undefined;

type CacheEntry = {
  audio: Buffer;
  createdAt: number;
  voiceName: SupportedVoiceName;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_CACHE_ITEMS = 200;
const audioCache = new Map<string, CacheEntry>();

export class AzureTtsError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'AzureTtsError';
    this.status = status;
  }
}

function escapeSsml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pruneCache(now = Date.now()) {
  for (const [key, entry] of audioCache.entries()) {
    if (now - entry.createdAt > CACHE_TTL_MS) {
      audioCache.delete(key);
    }
  }

  while (audioCache.size > MAX_CACHE_ITEMS) {
    const oldest = audioCache.keys().next();
    if (oldest.done) break;
    audioCache.delete(oldest.value);
  }
}

export function resolveAzureVoiceName(voice?: InputVoice, gender?: 'feminino' | 'masculino'): SupportedVoiceName {
  if (voice === AZURE_TTS_FEMALE_VOICE || voice === AZURE_TTS_MALE_VOICE) {
    return voice;
  }

  if (voice === 'masculino' || gender === 'masculino') {
    return AZURE_TTS_MALE_VOICE;
  }

  return AZURE_TTS_FEMALE_VOICE;
}

function getAzureCredentials() {
  const key = process.env.AZURE_TTS_KEY?.trim();
  const region = process.env.AZURE_TTS_REGION?.trim();

  if (!key || !region) {
    throw new AzureTtsError('Azure TTS nao configurado (AZURE_TTS_KEY/AZURE_TTS_REGION).', 503);
  }

  return { key, region };
}

function buildSsml(text: string, voiceName: SupportedVoiceName) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xml:lang="pt-BR">
  <voice name="${voiceName}">
    <prosody rate="-4%" pitch="0%">${escapeSsml(text)}</prosody>
  </voice>
</speak>`;
}

export async function synthesizeAzureTts(input: {
  text: string;
  voice?: InputVoice;
  gender?: 'feminino' | 'masculino';
}) {
  const text = input.text?.trim();
  if (!text) {
    throw new AzureTtsError('Texto invalido.', 400);
  }
  if (text.length > AZURE_TTS_MAX_TEXT_LENGTH) {
    throw new AzureTtsError(`Texto excede o limite de ${AZURE_TTS_MAX_TEXT_LENGTH} caracteres.`, 413);
  }

  const { key, region } = getAzureCredentials();
  const voiceName = resolveAzureVoiceName(input.voice, input.gender);
  const cacheKey = createHash('sha1').update(`${voiceName}|${text}`).digest('hex');
  const now = Date.now();

  pruneCache(now);

  const cached = audioCache.get(cacheKey);
  if (cached && now - cached.createdAt <= CACHE_TTL_MS) {
    return { audio: cached.audio, voiceName, cached: true };
  }

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisOutputFormat =
    SpeechSDK.SpeechSynthesisOutputFormat.Audio24Khz96KBitRateMonoMp3;

  const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

  try {
    const result = await new Promise<SpeechSDK.SpeechSynthesisResult>((resolve, reject) => {
      synthesizer.speakSsmlAsync(buildSsml(text, voiceName), resolve, reject);
    });

    if (result.reason !== SpeechSDK.ResultReason.SynthesizingAudioCompleted || !result.audioData?.byteLength) {
      const details = SpeechSDK.CancellationDetails.fromResult(result);
      const reason = details?.errorDetails || details?.reason || result.errorDetails || 'Falha desconhecida ao sintetizar audio.';
      throw new AzureTtsError(`Azure Speech falhou: ${reason}`, 502);
    }

    const audio = Buffer.from(result.audioData);
    audioCache.set(cacheKey, { audio, createdAt: now, voiceName });
    pruneCache(now);

    return { audio, voiceName, cached: false };
  } catch (error) {
    if (error instanceof AzureTtsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Erro ao sintetizar audio no Azure Speech.';
    throw new AzureTtsError(message, 502);
  } finally {
    synthesizer.close();
  }
}

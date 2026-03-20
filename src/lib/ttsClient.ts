export type AzureNarrationVoice = 'feminino' | 'masculino' | 'pt-BR-FranciscaNeural' | 'pt-BR-AntonioNeural' | string;

export async function fetchAzureTtsBlob(input: {
  text: string;
  voice?: AzureNarrationVoice;
  gender?: 'feminino' | 'masculino';
  signal?: AbortSignal;
}) {
  const response = await fetch('/api/tts/azure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: input.signal,
    body: JSON.stringify({
      text: input.text,
      voice: input.voice,
      gender: input.gender,
    }),
  });

  if (!response.ok) {
    let message = 'Falha ao sintetizar audio.';

    try {
      const data = await response.json();
      if (typeof data?.error === 'string' && data.error.trim()) {
        message = data.error.trim();
      }
    } catch {
      try {
        const text = await response.text();
        if (text.trim()) {
          message = text.trim();
        }
      } catch {}
    }

    throw new Error(message);
  }

  return response.blob();
}

export async function fetchAzureTtsObjectUrl(input: {
  text: string;
  voice?: AzureNarrationVoice;
  gender?: 'feminino' | 'masculino';
  signal?: AbortSignal;
}) {
  const blob = await fetchAzureTtsBlob(input);
  return URL.createObjectURL(blob);
}

import { NextResponse } from 'next/server';

const FEMALE_VOICE = 'pt-BR-FranciscaNeural';
const MALE_VOICE = 'pt-BR-AntonioNeural';

export async function POST(req: Request) {
  try {
    const { text, gender } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ ok: false, error: 'Texto inválido' }, { status: 400 });
    }

    const key = process.env.AZURE_TTS_KEY;
    const region = process.env.AZURE_TTS_REGION;

    if (!key || !region) {
      return NextResponse.json({ ok: false, error: 'Azure TTS não configurado (AZURE_TTS_KEY/AZURE_TTS_REGION)' }, { status: 500 });
    }

    const voice = gender === 'masculino' ? MALE_VOICE : FEMALE_VOICE;

    const ssml = `<?xml version="1.0" encoding="UTF-8"?>
<speak version="1.0" xml:lang="pt-BR">
  <voice name="${voice}">
    <prosody rate="-6%" pitch="0%">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</prosody>
  </voice>
</speak>`;

    const azureRes = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'programa-psicologia',
      },
      body: ssml,
    });

    if (!azureRes.ok) {
      const err = await azureRes.text();
      return NextResponse.json({ ok: false, error: `Azure erro: ${err}` }, { status: 500 });
    }

    const audioBuffer = await azureRes.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Erro interno' }, { status: 500 });
  }
}

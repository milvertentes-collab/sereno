import { NextResponse } from 'next/server';
import { AzureTtsError, synthesizeAzureTts } from '@/lib/server/azureTts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { text, voice, gender } = await req.json();
    const { audio, cached, voiceName } = await synthesizeAzureTts({ text, voice, gender });

    return new Response(new Uint8Array(audio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': cached ? 'public, max-age=3600, stale-while-revalidate=86400' : 'no-store',
        'X-Sereno-TTS-Voice': voiceName,
      },
    });
  } catch (error) {
    if (error instanceof AzureTtsError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao gerar TTS.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

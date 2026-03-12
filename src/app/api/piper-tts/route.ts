import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID, createHash } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const PY311 = 'C:/Users/Romulo/AppData/Local/Programs/Python/Python311/python.exe';
const PYTHON_BIN = process.env.PYTHON_BIN || PY311;

export async function POST(req: Request) {
  try {
    const { text, gender, voice } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ ok: false, error: 'Texto inválido' }, { status: 400 });
    }

    const root = process.cwd();
    const voicesDir = path.join(root, 'piper_voices');
    const cacheDir = path.join(root, '.tts_cache');
    await fs.mkdir(cacheDir, { recursive: true });

    // Edge Neural (mais natural, sem chave)
    if (gender === 'feminino' || voice === 'pt-BR-AntonioNeural') {
      const allowedEdgeVoices = [
        'pt-BR-FranciscaNeural',
        'pt-BR-ThalitaMultilingualNeural',
        'pt-BR-AntonioNeural',
      ];
      const defaultVoice = gender === 'masculino' ? 'pt-BR-AntonioNeural' : 'pt-BR-FranciscaNeural';
      const edgeVoice = (typeof voice === 'string' && allowedEdgeVoices.includes(voice.trim()))
        ? voice.trim()
        : defaultVoice;

      const cacheKey = createHash('sha1').update(`edge|${edgeVoice}|${text}`).digest('hex');
      const cachePath = path.join(cacheDir, `${cacheKey}.mp3`);

      try {
        const cached = await fs.readFile(cachePath);
        return new Response(cached, {
          status: 200,
          headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable' },
        });
      } catch {}

      const tempBase = path.join(os.tmpdir(), `edge-${randomUUID()}`);
      const outputPath = `${tempBase}.mp3`;

      await execFileAsync(PYTHON_BIN, [
        '-m', 'edge_tts',
        '--voice', edgeVoice,
        '--text', text,
        '--write-media', outputPath,
      ]);

      const audio = await fs.readFile(outputPath);
      await fs.writeFile(cachePath, audio).catch(() => {});
      fs.unlink(outputPath).catch(() => {});

      return new Response(audio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Masculina: Piper offline
    const allowedVoices = [
      'pt_BR-cadu-medium',
      'pt_BR-edresson-low',
      'pt_BR-jeff-medium',
      'pt_BR-faber-medium',
    ];

    const voiceName = (typeof voice === 'string' && allowedVoices.includes(voice))
      ? voice
      : 'pt_BR-cadu-medium';

    const modelPath = path.join(voicesDir, `${voiceName}.onnx`);
    const configPath = path.join(voicesDir, `${voiceName}.onnx.json`);

    const cacheKey = createHash('sha1').update(`piper|${voiceName}|${text}`).digest('hex');
    const cachePath = path.join(cacheDir, `${cacheKey}.wav`);

    try {
      const cached = await fs.readFile(cachePath);
      return new Response(cached, {
        status: 200,
        headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'public, max-age=31536000, immutable' },
      });
    } catch {}

    const tempBase = path.join(os.tmpdir(), `piper-${randomUUID()}`);
    const inputPath = `${tempBase}.txt`;
    const outputPath = `${tempBase}.wav`;

    await fs.writeFile(inputPath, text, 'utf8');

    await execFileAsync(PYTHON_BIN, [
      '-m', 'piper',
      '-m', modelPath,
      '-c', configPath,
      '-i', inputPath,
      '-f', outputPath,
      '--sentence-silence', '0.18',
      '--length-scale', '1.08',
      '--noise-scale', '0.20',
      '--noise-w-scale', '0.20',
      '--volume', '0.88',
    ]);

    const audio = await fs.readFile(outputPath);
    await fs.writeFile(cachePath, audio).catch(() => {});

    fs.unlink(inputPath).catch(() => {});
    fs.unlink(outputPath).catch(() => {});

    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Erro no TTS híbrido' }, { status: 500 });
  }
}

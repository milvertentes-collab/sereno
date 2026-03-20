import { NextResponse } from 'next/server';

type Job = { text: string; gender: 'masculino' | 'feminino'; voice: string };

type State = {
  running: boolean;
  total: number;
  done: number;
  failed: number;
  startedAt?: string;
  finishedAt?: string;
};

const g = globalThis as any;
if (!g.__ttsPrewarmState) {
  g.__ttsPrewarmState = { running: false, total: 0, done: 0, failed: 0 } as State;
}
const state: State = g.__ttsPrewarmState;

async function runPrewarm(jobs: Job[], origin: string, concurrency = 4) {
  state.running = true;
  state.total = jobs.length;
  state.done = 0;
  state.failed = 0;
  state.startedAt = new Date().toISOString();
  state.finishedAt = undefined;

  let i = 0;
  const worker = async () => {
    while (true) {
      const idx = i++;
      if (idx >= jobs.length) return;
      const j = jobs[idx];
      try {
        const r = await fetch(`${origin}/api/tts/azure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(j),
        });
        if (!r.ok) state.failed += 1;
      } catch {
        state.failed += 1;
      } finally {
        state.done += 1;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, () => worker()));
  state.running = false;
  state.finishedAt = new Date().toISOString();
}

export async function GET() {
  return NextResponse.json({ ok: true, ...state });
}

export async function POST(req: Request) {
  try {
    if (state.running) return NextResponse.json({ ok: true, message: 'already_running', ...state });

    const body = await req.json();
    const jobs = Array.isArray(body?.jobs) ? body.jobs as Job[] : [];
    const unique = new Map<string, Job>();
    for (const j of jobs) {
      if (!j?.text || !j?.voice || !j?.gender) continue;
      unique.set(`${j.gender}|${j.voice}|${j.text}`, j);
    }
    const deduped = [...unique.values()];

    if (!deduped.length) return NextResponse.json({ ok: false, error: 'sem_jobs' }, { status: 400 });

    const url = new URL(req.url);
    const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '') || 'http';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
    const origin = `${proto}://${host}`;

    runPrewarm(deduped, origin, 4).catch(() => {
      state.running = false;
      state.finishedAt = new Date().toISOString();
    });

    return NextResponse.json({ ok: true, started: true, total: deduped.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'erro' }, { status: 500 });
  }
}

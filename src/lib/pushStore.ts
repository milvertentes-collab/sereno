import { promises as fs } from 'fs';
import path from 'path';

export type PushSubRecord = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  birthdate?: string;
  reminders?: Record<string, any>;
  capsules?: Array<{ id: string; title?: string; type?: string; openAt?: string }>;
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'push-subs.json');

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, '[]', 'utf8');
  }
}

export async function readSubs(): Promise<PushSubRecord[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function upsertSub(input: PushSubRecord) {
  const current = await readSubs();
  const idx = current.findIndex((s) => s.endpoint === input.endpoint);
  if (idx >= 0) current[idx] = input;
  else current.push(input);
  await fs.writeFile(FILE_PATH, JSON.stringify(current, null, 2), 'utf8');
}

export async function removeSub(endpoint: string) {
  const current = await readSubs();
  const next = current.filter((s) => s.endpoint !== endpoint);
  await fs.writeFile(FILE_PATH, JSON.stringify(next, null, 2), 'utf8');
}

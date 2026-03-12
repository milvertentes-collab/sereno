import { promises as fs } from 'fs';
import path from 'path';

export type BroadcastItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'broadcasts.json');

async function ensureFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, '[]', 'utf8');
  }
}

export async function readBroadcasts(): Promise<BroadcastItem[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE_PATH, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function addBroadcast(item: BroadcastItem) {
  const all = await readBroadcasts();
  const next = [item, ...all].slice(0, 300);
  await fs.writeFile(FILE_PATH, JSON.stringify(next, null, 2), 'utf8');
}

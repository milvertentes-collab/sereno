import { promises as fs } from 'fs';
import path from 'path';

function dataFile(name: string) {
  return path.join(process.cwd(), 'data', name);
}

async function ensureDataDir() {
  await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
}

export async function readJsonFile<T>(name: string, fallback: T): Promise<T> {
  try {
    const file = dataFile(name);
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(name: string, value: T): Promise<void> {
  await ensureDataDir();
  const file = dataFile(name);
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf-8');
}

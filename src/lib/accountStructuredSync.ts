'use client';

import { supabase } from '@/lib/supabase';

type MoodEntryLike = Record<string, any>;
type DiaryEntryLike = Record<string, any>;
type ThoughtRecordLike = Record<string, any>;
type GratitudeEntryLike = Record<string, any>;
type GratitudePhotoLike = Record<string, any>;
type SoltaEntryLike = Record<string, any>;

export type StructuredContentSnapshot = {
  moodHistory: MoodEntryLike[];
  diaryEntries: DiaryEntryLike[];
  thoughtRecords: ThoughtRecordLike[];
  gratitudeEntries: GratitudeEntryLike[];
  gratitudePhotos: GratitudePhotoLike[];
  soltaEntries: SoltaEntryLike[];
};

function toIsoOrNow(value: any) {
  if (typeof value === 'string' && value.trim()) return value;
  return new Date().toISOString();
}

function mapRowsByContent<T = Record<string, any>>(rows: any[], fallbackMapper: (row: any) => T) {
  return Array.isArray(rows)
    ? rows.map((row) => (row.content && typeof row.content === 'object' ? row.content : fallbackMapper(row)))
    : [];
}

async function replaceTableRows(table: string, userId: string, rows: Record<string, any>[]) {
  if (rows.length === 0) return;
  const { error: upsertError } = await supabase
    .from(table)
    .upsert(rows, { onConflict: 'user_id,external_id' });
  if (upsertError) throw upsertError;
}

export async function loadStructuredContent(userId: string): Promise<{
  hasRemoteData: boolean;
  snapshot: StructuredContentSnapshot;
}> {
  const [
    { data: moodRows, error: moodError },
    { data: diaryRows, error: diaryError },
    { data: thoughtRows, error: thoughtError },
    { data: gratitudeRows, error: gratitudeError },
    { data: gratitudePhotoRows, error: gratitudePhotoError },
    { data: soltaRows, error: soltaError },
  ] = await Promise.all([
    supabase.from('mood_logs').select('external_id, mood, note, created_at, content').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('diary_entries').select('external_id, created_at, content').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('thought_records').select('external_id, created_at, content').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('gratitude_entries').select('external_id, text, created_at, content').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('gratitude_photos').select('external_id, url, caption, created_at, content').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('solta_entries').select('external_id, text, created_at, content').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);

  if (moodError) throw moodError;
  if (diaryError) throw diaryError;
  if (thoughtError) throw thoughtError;
  if (gratitudeError) throw gratitudeError;
  if (gratitudePhotoError) throw gratitudePhotoError;
  if (soltaError) throw soltaError;

  const snapshot: StructuredContentSnapshot = {
    moodHistory: mapRowsByContent(moodRows || [], (row) => ({
      id: row.external_id || row.id,
      primaryEmotion: row.mood,
      note: row.note || '',
      createdAt: row.created_at,
    })),
    diaryEntries: mapRowsByContent(diaryRows || [], (row) => ({
      id: row.external_id || row.id,
      createdAt: row.created_at,
    })),
    thoughtRecords: mapRowsByContent(thoughtRows || [], (row) => ({
      id: row.external_id || row.id,
      createdAt: row.created_at,
    })),
    gratitudeEntries: mapRowsByContent(gratitudeRows || [], (row) => ({
      id: row.external_id || row.id,
      text: row.text,
      createdAt: row.created_at,
    })),
    gratitudePhotos: mapRowsByContent(gratitudePhotoRows || [], (row) => ({
      id: row.external_id || row.id,
      url: row.url,
      caption: row.caption || '',
      createdAt: row.created_at,
    })),
    soltaEntries: mapRowsByContent(soltaRows || [], (row) => ({
      id: row.external_id || row.id,
      text: row.text,
      createdAt: row.created_at,
    })),
  };

  const hasRemoteData = Object.values(snapshot).some((items) => items.length > 0);
  return { hasRemoteData, snapshot };
}

export async function saveMoodHistory(userId: string, items: MoodEntryLike[]) {
  await replaceTableRows(
    'mood_logs',
    userId,
    items.map((item) => ({
      user_id: userId,
      external_id: String(item.id || crypto.randomUUID()),
      mood: String(item.primaryEmotion || item.mood || 'registro'),
      note: String(item.note || ''),
      content: item,
      created_at: toIsoOrNow(item.createdAt || `${item.date || ''}T${item.time || ''}`),
    })),
  );
}

export async function saveDiaryEntries(userId: string, items: DiaryEntryLike[]) {
  await replaceTableRows(
    'diary_entries',
    userId,
    items.map((item) => ({
      user_id: userId,
      external_id: String(item.id || crypto.randomUUID()),
      content: item,
      created_at: toIsoOrNow(item.createdAt || `${item.date || ''}T${item.time || ''}`),
    })),
  );
}

export async function saveThoughtRecords(userId: string, items: ThoughtRecordLike[]) {
  await replaceTableRows(
    'thought_records',
    userId,
    items.map((item) => ({
      user_id: userId,
      external_id: String(item.id || crypto.randomUUID()),
      content: item,
      created_at: toIsoOrNow(item.createdAt || `${item.date || ''}T${item.time || ''}`),
    })),
  );
}

export async function saveGratitudeEntries(userId: string, items: GratitudeEntryLike[]) {
  await replaceTableRows(
    'gratitude_entries',
    userId,
    items.map((item) => ({
      user_id: userId,
      external_id: String(item.id || crypto.randomUUID()),
      text: Array.isArray(item.items) ? item.items.join(' • ').slice(0, 5000) : String(item.text || ''),
      content: item,
      created_at: toIsoOrNow(item.createdAt || item.date),
    })),
  );
}

export async function saveGratitudePhotos(userId: string, items: GratitudePhotoLike[]) {
  await replaceTableRows(
    'gratitude_photos',
    userId,
    items.map((item) => ({
      user_id: userId,
      external_id: String(item.id || crypto.randomUUID()),
      url: String(item.url || ''),
      caption: String(item.caption || ''),
      content: item,
      created_at: toIsoOrNow(item.createdAt),
    })),
  );
}

export async function saveSoltaEntries(userId: string, items: SoltaEntryLike[]) {
  await replaceTableRows(
    'solta_entries',
    userId,
    items.map((item) => ({
      user_id: userId,
      external_id: String(item.id || crypto.randomUUID()),
      text: String(item.text || ''),
      content: item,
      created_at: toIsoOrNow(item.createdAt),
    })),
  );
}

'use client';

import { supabase } from '@/lib/supabase';

export const ACCOUNT_BUCKET_DEFINITIONS = {
  settings: {
    table: 'user_settings_snapshots',
    keys: [
      'darkMode',
      'dailyGoal',
      'default_voice',
      'privacySettings',
      'audioSettings',
      'wellbeing_settings',
      'reminderSettings',
      'sereno_reminders_resume_v1',
      'sereno_reminder_settings',
      'breathing-audio-enabled',
    ],
  },
  progress: {
    table: 'user_progress_snapshots',
    keys: [
      'userProgress',
      'daily_practice_minutes_v1',
      'daily_practice_seconds_v2',
      'daily_practice_initialized_day_v1',
      'tabUsage',
      'tabUsageSeconds',
      'subscription_data',
      'therapy_sessions',
    ],
  },
  favorites: {
    table: 'user_favorites_snapshots',
    keys: [
      'ambientFavorites',
      'home_favorite_tabs',
      'psico_dictionary_favorites',
      'psico_toxic_favorites',
      'psico_pills_fav',
    ],
  },
  habits: {
    table: 'user_habits_snapshots',
    keys: [
      'psico_habits_reqs',
      'psico_habits_history',
      'sereno-daily-habits-streak',
    ],
  },
  missions: {
    table: 'user_missions_snapshots',
    keys: [
      'psico_challenges',
      'psico_today_missions',
    ],
  },
  tracks: {
    table: 'user_tracks_snapshots',
    keys: [
      'psico_tracks_progress',
      'psico_tracks_rewards',
    ],
  },
  home: {
    table: 'user_home_snapshots',
    keys: [
      'home_continue_state_v1',
    ],
  },
  auxiliary: {
    table: 'user_auxiliary_snapshots',
    keys: [
      'regulation-profile-history',
      'regulation-profile-favorites',
      'regulation-profile-last-score',
      'safetyPlan',
      'inbox_items_v1',
      'inbox_dismissed_v1',
      'voice_usage_history',
      'mural-esperanca-display-state',
    ],
    prefixes: [
      'regulation-profile-',
      'safety-plan-',
      'mural-',
      'inbox_',
      'voice_usage_',
    ],
  },
} as const;

export type AccountBucketName = keyof typeof ACCOUNT_BUCKET_DEFINITIONS;
type BucketDefinition = {
  table: string;
  keys: readonly string[];
  prefixes?: readonly string[];
};

export function getBucketForKey(key: string): AccountBucketName | null {
  const entry = Object.entries(ACCOUNT_BUCKET_DEFINITIONS as Record<string, BucketDefinition>).find(([, config]) =>
    config.keys.includes(key as never) || config.prefixes?.some((prefix) => key.startsWith(prefix)),
  );
  return (entry?.[0] as AccountBucketName | undefined) || null;
}

function parseStoredValue(raw: string | null) {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function getBucketSnapshot(name: AccountBucketName) {
  if (typeof window === 'undefined') return {} as Record<string, any>;
  const definition = ACCOUNT_BUCKET_DEFINITIONS[name] as BucketDefinition;
  const keys = new Set<string>(definition.keys);

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    if (definition.prefixes?.some((prefix) => key.startsWith(prefix))) {
      keys.add(key);
    }
  }

  const snapshot: Record<string, any> = {};
  keys.forEach((key) => {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return;
    snapshot[key] = parseStoredValue(raw);
  });
  return snapshot;
}

function applyBucketSnapshot(snapshot: Record<string, any>) {
  if (typeof window === 'undefined') return;
  Object.entries(snapshot || {}).forEach(([key, value]) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  });
}

async function loadBucket(userId: string, name: AccountBucketName) {
  const { table } = ACCOUNT_BUCKET_DEFINITIONS[name];
  const { data, error } = await supabase
    .from(table)
    .select('content, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.content && typeof data.content === 'object' ? data.content as Record<string, any> : null;
}

async function saveBucket(userId: string, name: AccountBucketName, content: Record<string, any>) {
  const { table } = ACCOUNT_BUCKET_DEFINITIONS[name];
  const { error } = await supabase
    .from(table)
    .upsert({
      user_id: userId,
      content,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) throw error;
}

export async function hydrateAccountBuckets(userId: string) {
  const bucketNames = Object.keys(ACCOUNT_BUCKET_DEFINITIONS) as AccountBucketName[];
  const loaded = await Promise.all(bucketNames.map(async (name) => ({
    name,
    remote: await loadBucket(userId, name),
  })));

  for (const entry of loaded) {
    if (entry.remote && Object.keys(entry.remote).length > 0) {
      applyBucketSnapshot(entry.remote);
      continue;
    }

    const localSnapshot = getBucketSnapshot(entry.name);
    if (Object.keys(localSnapshot).length > 0) {
      await saveBucket(userId, entry.name, localSnapshot);
    }
  }
}

export async function syncAccountBucketByKey(userId: string, key: string) {
  const bucket = getBucketForKey(key);
  if (!bucket) return;
  const snapshot = getBucketSnapshot(bucket);
  await saveBucket(userId, bucket, snapshot);
}

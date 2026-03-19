'use client';

import { supabase } from '@/lib/supabase';

export const STORAGE_SYNC_EVENT = 'sereno-storage-sync';

export const DEVICE_ONLY_EXACT_KEYS = [
  'isLoggedIn',
  'sereno_device_id',
  'sereno_reminders_midday_v4',
  'sereno_daily_goal_default_v1',
] as const;

export const DEVICE_ONLY_PREFIXES = [
  'sereno_admin_',
  'admin_',
  'birthday-shown-',
  'birthday_notified_',
  'birthday_celebration_seen_',
  'therapy-reminder-',
] as const;

export const ACCOUNT_SYNC_EXACT_KEYS = [
  'userAccount',
  'darkMode',
  'dailyGoal',
  'default_voice',
  'privacySettings',
  'audioSettings',
  'wellbeing_settings',
  'reminderSettings',
  'home_continue_state_v1',
  'ambientFavorites',
  'sereno_reminders_resume_v1',
  'sereno_reminder_settings',
  'sereno-daily-habits-streak',
  'breathing-audio-enabled',
] as const;

export const STRUCTURED_CONTENT_KEYS = [
  'moodHistory',
  'diaryEntries',
  'thoughtRecords',
  'gratitudeEntries',
  'gratitudePhotos',
  'soltaEntries',
] as const;

export const ACCOUNT_BUCKET_KEYS = [
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
  'userProgress',
  'daily_practice_minutes_v1',
  'daily_practice_seconds_v2',
  'daily_practice_initialized_day_v1',
  'tabUsage',
  'tabUsageSeconds',
  'subscription_data',
  'therapy_sessions',
  'ambientFavorites',
  'home_favorite_tabs',
  'psico_dictionary_favorites',
  'psico_toxic_favorites',
  'psico_pills_fav',
  'psico_habits_reqs',
  'psico_habits_history',
  'sereno-daily-habits-streak',
  'psico_challenges',
  'psico_today_missions',
  'psico_tracks_progress',
  'psico_tracks_rewards',
  'home_continue_state_v1',
  'safetyPlan',
] as const;

export const ACCOUNT_BUCKET_PREFIXES = [
  'regulation-profile-',
  'safety-plan-',
  'mural-',
  'inbox_',
  'voice_usage_',
] as const;

export const ACCOUNT_SYNC_PREFIXES = [
  'psico_',
  'sereno_',
  'therapy_sessions',
  'thoughtRecords',
  'moodHistory',
  'diaryEntries',
  'gratitudeEntries',
  'gratitudePhotos',
  'soltaEntries',
  'userProgress',
  'daily_practice_',
  'healthy-self-',
  'home_favorite_tabs',
  'regulation-profile-',
  'safety-plan-',
  'mural-',
  'daily_practice',
  'tabUsageSeconds',
  'dailyPracticeSeconds',
  'dailyPracticeMinutes',
  'voice_usage_',
  'inbox_',
] as const;

export const TABLE_CANDIDATE_PREFIXES = [
  'moodHistory',
  'diaryEntries',
  'gratitudeEntries',
  'gratitudePhotos',
  'soltaEntries',
  'therapy_sessions',
  'psico_time_capsule',
  'psico_habits_',
  'psico_challenges',
  'psico_tracks_',
  'thoughtRecords',
] as const;

const EXCLUDED_KEYS = new Set<string>(DEVICE_ONLY_EXACT_KEYS);
const EXCLUDED_PREFIXES = [...DEVICE_ONLY_PREFIXES];

function safeParseStoredValue(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function shouldSyncPreferenceKey(key: string) {
  if (!key) return false;
  if (STRUCTURED_CONTENT_KEYS.includes(key as (typeof STRUCTURED_CONTENT_KEYS)[number])) return false;
  if (ACCOUNT_BUCKET_KEYS.includes(key as (typeof ACCOUNT_BUCKET_KEYS)[number])) return false;
  if (ACCOUNT_BUCKET_PREFIXES.some((prefix) => key.startsWith(prefix))) return false;
  if (EXCLUDED_KEYS.has(key)) return false;
  if (EXCLUDED_PREFIXES.some((prefix) => key.startsWith(prefix))) return false;
  return true;
}

export function classifyPreferenceKey(key: string) {
  if (!key) return { scope: 'unknown', reason: 'empty-key' } as const;
  if (DEVICE_ONLY_EXACT_KEYS.includes(key as (typeof DEVICE_ONLY_EXACT_KEYS)[number])) {
    return { scope: 'device', reason: 'device-exact' } as const;
  }
  if (DEVICE_ONLY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return { scope: 'device', reason: 'device-prefix' } as const;
  }
  if (STRUCTURED_CONTENT_KEYS.includes(key as (typeof STRUCTURED_CONTENT_KEYS)[number])) {
    return { scope: 'table', reason: 'structured-content' } as const;
  }
  if (ACCOUNT_BUCKET_KEYS.includes(key as (typeof ACCOUNT_BUCKET_KEYS)[number])) {
    return { scope: 'bucket', reason: 'account-bucket' } as const;
  }
  if (ACCOUNT_BUCKET_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return { scope: 'bucket', reason: 'account-bucket-prefix' } as const;
  }
  if (ACCOUNT_SYNC_EXACT_KEYS.includes(key as (typeof ACCOUNT_SYNC_EXACT_KEYS)[number])) {
    return { scope: 'account', reason: 'account-exact' } as const;
  }
  if (ACCOUNT_SYNC_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return { scope: 'account', reason: 'account-prefix' } as const;
  }
  return { scope: 'account', reason: 'account-fallback' } as const;
}

export function dispatchStorageSyncEvent(key: string, rawValue: string | null) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(STORAGE_SYNC_EVENT, {
    detail: {
      key,
      rawValue,
      removed: rawValue === null,
    },
  }));
}

export function installStorageSyncBridge() {
  if (typeof window === 'undefined') return;
  const marker = '__serenoStorageBridgeInstalled';
  const storageProto = Storage.prototype as Storage & { [marker]?: boolean; __serenoOriginalSetItem?: Storage['setItem']; __serenoOriginalRemoveItem?: Storage['removeItem'] };

  if (storageProto[marker]) return;

  storageProto[marker] = true;
  storageProto.__serenoOriginalSetItem = storageProto.setItem;
  storageProto.__serenoOriginalRemoveItem = storageProto.removeItem;

  storageProto.setItem = function patchedSetItem(key: string, value: string) {
    storageProto.__serenoOriginalSetItem!.call(this, key, value);
    if (this === window.localStorage) {
      dispatchStorageSyncEvent(key, value);
    }
  };

  storageProto.removeItem = function patchedRemoveItem(key: string) {
    storageProto.__serenoOriginalRemoveItem!.call(this, key);
    if (this === window.localStorage) {
      dispatchStorageSyncEvent(key, null);
    }
  };
}

export function getLocalPreferenceSnapshot() {
  if (typeof window === 'undefined') return [] as Array<{ key: string; value: any }>;

  const entries: Array<{ key: string; value: any }> = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key || !shouldSyncPreferenceKey(key)) continue;
    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) continue;
    entries.push({
      key,
      value: safeParseStoredValue(rawValue),
    });
  }
  return entries;
}

export async function loadCloudPreferences(userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('key, value, updated_at')
    .eq('user_id', userId);

  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export function applyCloudPreferences(rows: Array<{ key: string; value: any }>) {
  if (typeof window === 'undefined') return;

  rows.forEach((row) => {
    if (!row?.key || !shouldSyncPreferenceKey(row.key)) return;
    window.localStorage.setItem(row.key, JSON.stringify(row.value));
  });
}

export async function upsertCloudPreference(userId: string, key: string, value: any) {
  if (!shouldSyncPreferenceKey(key)) return;

  const payload = {
    user_id: userId,
    key,
    value,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id,key' });

  if (error) throw error;
}

export async function removeCloudPreference(userId: string, key: string) {
  if (!shouldSyncPreferenceKey(key)) return;

  const { error } = await supabase
    .from('user_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('key', key);

  if (error) throw error;
}

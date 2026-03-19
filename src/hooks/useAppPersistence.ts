'use client';

import { useLocalStorage } from './useLocalStorage';

type SyncOptions = {
  tableName?: string;
  syncStrategy?: 'overwrite' | 'merge';
};

export function useAppPersistence<T>(
  key: string,
  initialValue: T,
  _options: SyncOptions = {}
) {
  return useLocalStorage<T>(key, initialValue);
}

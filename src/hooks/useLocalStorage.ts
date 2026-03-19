'use client';

import { useState, useCallback, useEffect } from 'react';
import { STORAGE_SYNC_EVENT } from '@/lib/cloudPreferenceSync';

function parseStoredValue<T>(item: string | null, fallback: T): T {
  if (!item) return fallback;

  try {
    const parsed = JSON.parse(item);

    if (parsed === null && fallback !== null) {
      return fallback;
    }

    return parsed;
  } catch (error) {
    console.error(`Error reading localStorage key value:`, error);
    return fallback;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with value from localStorage if available
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      return parseStoredValue(window.localStorage.getItem(key), initialValue);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncFromStorage = (rawValue: string | null) => {
      if (rawValue === null) {
        setStoredValue(initialValue);
        return;
      }
      setStoredValue(parseStoredValue<T>(rawValue, initialValue));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      syncFromStorage(event.newValue);
    };

    const handleCustomStorage = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string; rawValue?: string | null }>;
      if (customEvent.detail?.key !== key) return;
      syncFromStorage(customEvent.detail?.rawValue ?? null);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(STORAGE_SYNC_EVENT, handleCustomStorage as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(STORAGE_SYNC_EVENT, handleCustomStorage as EventListener);
    };
  }, [initialValue, key]);

  return [storedValue, setValue];
}

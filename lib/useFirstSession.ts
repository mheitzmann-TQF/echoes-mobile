import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firstSessionKeys = new Set<string>();
const resolvedKeys = new Map<string, boolean>();

function readSyncWeb(storageKey: string): boolean | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const val = localStorage.getItem(storageKey);
    if (val === 'true') {
      resolvedKeys.set(storageKey, false);
      return false;
    } else {
      firstSessionKeys.add(storageKey);
      resolvedKeys.set(storageKey, true);
      localStorage.setItem(storageKey, 'true');
      return true;
    }
  } catch {
    return null;
  }
}

export function useFirstSession(storageKey: string): boolean | null {
  const [isFirstSession, setIsFirstSession] = useState<boolean | null>(() => {
    if (firstSessionKeys.has(storageKey)) return true;
    if (resolvedKeys.has(storageKey)) return resolvedKeys.get(storageKey)!;
    if (Platform.OS === 'web') return readSyncWeb(storageKey);
    return null;
  });

  useEffect(() => {
    if (firstSessionKeys.has(storageKey) || resolvedKeys.has(storageKey)) {
      return;
    }

    let cancelled = false;
    AsyncStorage.getItem(storageKey).then((val) => {
      if (cancelled) return;
      if (val === 'true') {
        resolvedKeys.set(storageKey, false);
        setIsFirstSession(false);
      } else {
        firstSessionKeys.add(storageKey);
        resolvedKeys.set(storageKey, true);
        AsyncStorage.setItem(storageKey, 'true').catch(() => {});
        setIsFirstSession(true);
      }
    }).catch(() => {
      if (!cancelled) {
        firstSessionKeys.add(storageKey);
        resolvedKeys.set(storageKey, true);
        setIsFirstSession(true);
      }
    });

    return () => { cancelled = true; };
  }, [storageKey]);

  return isFirstSession;
}

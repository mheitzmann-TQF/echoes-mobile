import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firstSessionKeys = new Set<string>();
const resolvedKeys = new Map<string, boolean>();

export function useFirstSession(storageKey: string): boolean | null {
  const [isFirstSession, setIsFirstSession] = useState<boolean | null>(() => {
    if (firstSessionKeys.has(storageKey)) return true;
    if (resolvedKeys.has(storageKey)) return resolvedKeys.get(storageKey)!;
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

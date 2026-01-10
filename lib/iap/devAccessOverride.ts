import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

export type DevAccessState = 'trial' | 'paid' | 'expired' | null;

const DEV_ACCESS_KEY = '@echoes_dev_access_override';

function isDevEnvironment(): boolean {
  if (!__DEV__) return false;
  if (Platform.OS === 'web') return true;
  if (!Constants.isDevice) return true;
  return false;
}

let cachedOverride: DevAccessState = null;

export async function getDevAccessOverride(): Promise<DevAccessState> {
  if (!isDevEnvironment()) return null;
  
  try {
    const stored = await AsyncStorage.getItem(DEV_ACCESS_KEY);
    if (stored === 'trial' || stored === 'paid' || stored === 'expired') {
      cachedOverride = stored;
      return stored;
    }
  } catch (e) {
    console.log('[DEV_ACCESS] Error reading override:', e);
  }
  return null;
}

export async function setDevAccessOverride(state: DevAccessState): Promise<void> {
  if (!isDevEnvironment()) {
    console.warn('[DEV_ACCESS] Cannot set override in production');
    return;
  }
  
  try {
    if (state === null) {
      await AsyncStorage.removeItem(DEV_ACCESS_KEY);
    } else {
      await AsyncStorage.setItem(DEV_ACCESS_KEY, state);
    }
    cachedOverride = state;
    console.log('[DEV_ACCESS] Override set to:', state);
  } catch (e) {
    console.error('[DEV_ACCESS] Error setting override:', e);
  }
}

export function getCachedDevOverride(): DevAccessState {
  if (!isDevEnvironment()) return null;
  return cachedOverride;
}

export async function cycleDevAccessState(): Promise<DevAccessState> {
  if (!isDevEnvironment()) return null;
  
  const current = await getDevAccessOverride();
  let next: DevAccessState;
  
  switch (current) {
    case null:
      next = 'trial';
      break;
    case 'trial':
      next = 'paid';
      break;
    case 'paid':
      next = 'expired';
      break;
    case 'expired':
      next = null;
      break;
    default:
      next = null;
  }
  
  await setDevAccessOverride(next);
  return next;
}

export function devStateToEntitlement(state: DevAccessState): {
  isFullAccess: boolean;
  expiresAt: string | null;
  source: 'dev-override';
} | null {
  if (state === null) return null;
  
  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  switch (state) {
    case 'trial':
      return {
        isFullAccess: true,
        expiresAt: futureDate.toISOString(),
        source: 'dev-override',
      };
    case 'paid':
      return {
        isFullAccess: true,
        expiresAt: futureDate.toISOString(),
        source: 'dev-override',
      };
    case 'expired':
      return {
        isFullAccess: false,
        expiresAt: pastDate.toISOString(),
        source: 'dev-override',
      };
    default:
      return null;
  }
}

export function isDevOverrideAvailable(): boolean {
  return isDevEnvironment();
}

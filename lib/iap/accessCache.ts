import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'echoes_access_cache';
const INSTALL_TIMESTAMP_KEY = 'echoes_install_timestamp';

export interface AccessCache {
  lastKnownAccess: 'full' | 'free' | null;
  lastVerifiedAt: number | null;
  expiresAt: string | null;
}

const GRACE_PERIODS = {
  FRESH_INSTALL_HOURS: 72,
  PRIOR_ACCESS_HOURS: 24,
};

export async function getInstallTimestamp(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(INSTALL_TIMESTAMP_KEY);
    if (stored) {
      return parseInt(stored, 10);
    }
    const now = Date.now();
    await AsyncStorage.setItem(INSTALL_TIMESTAMP_KEY, now.toString());
    return now;
  } catch (error) {
    console.error('[ACCESS_CACHE] Error getting install timestamp:', error);
    return Date.now();
  }
}

export async function getAccessCache(): Promise<AccessCache> {
  try {
    const stored = await AsyncStorage.getItem(CACHE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[ACCESS_CACHE] Error reading cache:', error);
  }
  return {
    lastKnownAccess: null,
    lastVerifiedAt: null,
    expiresAt: null,
  };
}

export async function setAccessCache(
  access: 'full' | 'free',
  expiresAt: string | null
): Promise<void> {
  try {
    const cache: AccessCache = {
      lastKnownAccess: access,
      lastVerifiedAt: Date.now(),
      expiresAt,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log('[ACCESS_CACHE] Cached access state:', access);
  } catch (error) {
    console.error('[ACCESS_CACHE] Error writing cache:', error);
  }
}

export async function clearAccessCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('[ACCESS_CACHE] Error clearing cache:', error);
  }
}

export interface GraceResult {
  shouldGrantGrace: boolean;
  reason: 'fresh_install' | 'prior_access' | 'none';
  hoursRemaining: number;
}

export async function checkGraceEligibility(): Promise<GraceResult> {
  const installTimestamp = await getInstallTimestamp();
  const cache = await getAccessCache();
  const now = Date.now();
  
  const hoursSinceInstall = (now - installTimestamp) / (1000 * 60 * 60);
  
  if (hoursSinceInstall < GRACE_PERIODS.FRESH_INSTALL_HOURS) {
    return {
      shouldGrantGrace: true,
      reason: 'fresh_install',
      hoursRemaining: Math.ceil(GRACE_PERIODS.FRESH_INSTALL_HOURS - hoursSinceInstall),
    };
  }
  
  if (cache.lastKnownAccess === 'full' && cache.lastVerifiedAt) {
    const hoursSinceVerification = (now - cache.lastVerifiedAt) / (1000 * 60 * 60);
    if (hoursSinceVerification < GRACE_PERIODS.PRIOR_ACCESS_HOURS) {
      return {
        shouldGrantGrace: true,
        reason: 'prior_access',
        hoursRemaining: Math.ceil(GRACE_PERIODS.PRIOR_ACCESS_HOURS - hoursSinceVerification),
      };
    }
  }
  
  return {
    shouldGrantGrace: false,
    reason: 'none',
    hoursRemaining: 0,
  };
}

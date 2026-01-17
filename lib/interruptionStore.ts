import AsyncStorage from '@react-native-async-storage/async-storage';

const INTERRUPTION_STORE_KEY = 'echoes_interruption_state';

export interface InterruptionState {
  last_signature: string;
  seen_count: number;
  first_seen_at: number;
  last_open_at: number;
  cached_message: string | null;
  cached_type: string | null;
}

const DEFAULT_STATE: InterruptionState = {
  last_signature: '',
  seen_count: 0,
  first_seen_at: 0,
  last_open_at: 0,
  cached_message: null,
  cached_type: null,
};

export async function getInterruptionState(): Promise<InterruptionState> {
  try {
    const stored = await AsyncStorage.getItem(INTERRUPTION_STORE_KEY);
    if (stored) {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.log('[Interruption] Failed to read state:', error);
  }
  return DEFAULT_STATE;
}

export async function saveInterruptionState(state: InterruptionState): Promise<void> {
  try {
    await AsyncStorage.setItem(INTERRUPTION_STORE_KEY, JSON.stringify(state));
  } catch (error) {
    console.log('[Interruption] Failed to save state:', error);
  }
}

export type InterruptionTier = 0 | 1 | 2;

export function calculateTier(state: InterruptionState, signature: string): InterruptionTier {
  const now = Date.now();
  const isFastPath = state.last_open_at > 0 && (now - state.last_open_at) < 120000;
  
  if (isFastPath) {
    return 2;
  }
  
  if (signature !== state.last_signature) {
    return 0;
  }
  
  const effectiveCount = state.seen_count + 1;
  
  if (effectiveCount >= 4) {
    return 2;
  }
  
  if (effectiveCount >= 2 && effectiveCount <= 3) {
    return 1;
  }
  
  return 0;
}

export async function processInterruption(
  signature: string,
  message: string,
  type: string
): Promise<{ tier: InterruptionTier; state: InterruptionState }> {
  const oldState = await getInterruptionState();
  const now = Date.now();
  
  const tier = calculateTier(oldState, signature);
  
  let newState: InterruptionState;
  
  if (signature !== oldState.last_signature) {
    newState = {
      last_signature: signature,
      seen_count: 0,
      first_seen_at: now,
      last_open_at: now,
      cached_message: message,
      cached_type: type,
    };
  } else {
    newState = {
      ...oldState,
      seen_count: oldState.seen_count + 1,
      last_open_at: now,
      cached_message: message,
      cached_type: type,
    };
  }
  
  await saveInterruptionState(newState);
  
  return { tier, state: newState };
}

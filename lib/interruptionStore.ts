import AsyncStorage from '@react-native-async-storage/async-storage';

const INTERRUPTION_STORE_KEY = 'echoes_interruption_state';

export interface InterruptionState {
  cached_message: string | null;
  cached_type: string | null;
  last_fetch_at: number;
}

const DEFAULT_STATE: InterruptionState = {
  cached_message: null,
  cached_type: null,
  last_fetch_at: 0,
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

export async function cacheInterruption(message: string, type: string): Promise<void> {
  const state: InterruptionState = {
    cached_message: message,
    cached_type: type,
    last_fetch_at: Date.now(),
  };
  await saveInterruptionState(state);
}

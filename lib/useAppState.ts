import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_ACTIVE_DATE_KEY = 'echoes_last_active_date';

type AppStateListener = {
  onResume?: () => void;
  onNewDay?: () => void;
};

const listeners = new Set<AppStateListener>();

let lastActiveDate: string | null = null;
let isInitialized = false;

function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function loadLastActiveDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_ACTIVE_DATE_KEY);
  } catch {
    return null;
  }
}

async function saveLastActiveDate(dateString: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_DATE_KEY, dateString);
    lastActiveDate = dateString;
  } catch {
    console.log('[AppState] Failed to save last active date');
  }
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState === 'active') {
    const today = getDateString();
    const isNewDay = lastActiveDate !== null && lastActiveDate !== today;
    
    console.log('[AppState] App became active. Last active:', lastActiveDate, 'Today:', today, 'New day:', isNewDay);
    
    listeners.forEach(listener => {
      if (listener.onResume) {
        listener.onResume();
      }
      if (isNewDay && listener.onNewDay) {
        listener.onNewDay();
      }
    });
    
    saveLastActiveDate(today);
  }
}

export function initAppStateListener() {
  if (isInitialized) return;
  
  isInitialized = true;
  
  loadLastActiveDate().then(stored => {
    const today = getDateString();
    if (stored) {
      lastActiveDate = stored;
      console.log('[AppState] Loaded last active date:', stored);
    } else {
      lastActiveDate = today;
      saveLastActiveDate(today);
      console.log('[AppState] First launch, setting date:', today);
    }
  });
  
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  
  return () => {
    subscription.remove();
    isInitialized = false;
  };
}

export function useAppStateListener(callbacks: AppStateListener) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  
  useEffect(() => {
    const listener: AppStateListener = {
      onResume: () => callbacksRef.current.onResume?.(),
      onNewDay: () => callbacksRef.current.onNewDay?.(),
    };
    
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);
}

export function checkIfNewDay(): boolean {
  const today = getDateString();
  return lastActiveDate !== null && lastActiveDate !== today;
}

export function updateLastActiveDate(): void {
  const today = getDateString();
  saveLastActiveDate(today);
}

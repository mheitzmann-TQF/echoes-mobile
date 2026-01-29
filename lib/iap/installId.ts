import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const INSTALL_ID_KEY = 'echoes_install_id';
const ASYNC_INSTALL_ID_KEY = '@echoes_install_id_backup';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getFromSecureStore(): Promise<string | null> {
  try {
    const id = await SecureStore.getItemAsync(INSTALL_ID_KEY);
    if (Platform.OS === 'ios') {
      console.log('[IAP:iOS] SecureStore read:', id ? 'found' : 'empty');
    }
    return id;
  } catch (error: any) {
    if (Platform.OS === 'ios') {
      console.error('[IAP:iOS] SecureStore read FAILED:', error?.message || error);
    }
    return null;
  }
}

async function setToSecureStore(id: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(INSTALL_ID_KEY, id);
    if (Platform.OS === 'ios') {
      console.log('[IAP:iOS] SecureStore write: success');
    }
    return true;
  } catch (error: any) {
    if (Platform.OS === 'ios') {
      console.error('[IAP:iOS] SecureStore write FAILED:', error?.message || error);
    }
    return false;
  }
}

async function getFromAsyncStorage(): Promise<string | null> {
  try {
    const id = await AsyncStorage.getItem(ASYNC_INSTALL_ID_KEY);
    if (Platform.OS === 'ios') {
      console.log('[IAP:iOS] AsyncStorage read:', id ? 'found' : 'empty');
    }
    return id;
  } catch (error: any) {
    if (Platform.OS === 'ios') {
      console.error('[IAP:iOS] AsyncStorage read FAILED:', error?.message || error);
    }
    return null;
  }
}

async function setToAsyncStorage(id: string): Promise<boolean> {
  try {
    await AsyncStorage.setItem(ASYNC_INSTALL_ID_KEY, id);
    if (Platform.OS === 'ios') {
      console.log('[IAP:iOS] AsyncStorage write: success');
    }
    return true;
  } catch (error: any) {
    if (Platform.OS === 'ios') {
      console.error('[IAP:iOS] AsyncStorage write FAILED:', error?.message || error);
    }
    return false;
  }
}

export async function getInstallId(): Promise<string> {
  // Web uses localStorage
  if (Platform.OS === 'web') {
    try {
      let installId = localStorage.getItem(INSTALL_ID_KEY);
      if (!installId) {
        installId = generateUUID();
        localStorage.setItem(INSTALL_ID_KEY, installId);
        console.log('[IAP] Generated new installId (web):', installId);
      }
      return installId;
    } catch (error) {
      console.error('[IAP] Web storage error:', error);
      return generateUUID();
    }
  }

  // Step 1: Try SecureStore (primary for both iOS and Android)
  let installId = await getFromSecureStore();
  
  if (installId) {
    console.log('[IAP] Retrieved installId from SecureStore');
    // iOS only: backup to AsyncStorage for resilience
    if (Platform.OS === 'ios') {
      await setToAsyncStorage(installId);
    }
    return installId;
  }
  
  // Step 2: SecureStore failed or empty
  // iOS ONLY: Try AsyncStorage backup (iOS has keychain issues)
  // Android: SecureStore is reliable, skip AsyncStorage fallback
  if (Platform.OS === 'ios') {
    console.log('[IAP:iOS] SecureStore empty/failed, checking AsyncStorage backup...');
    
    installId = await getFromAsyncStorage();
    
    if (installId) {
      console.log('[IAP:iOS] Retrieved installId from AsyncStorage backup');
      // Try to restore to SecureStore for next time
      await setToSecureStore(installId);
      return installId;
    }
  }
  
  // Step 3: No ID found - fresh install, generate new ID
  console.log('[IAP] No existing installId found, generating new one');
  installId = generateUUID();
  
  // Store to SecureStore (both platforms)
  const secureSuccess = await setToSecureStore(installId);
  
  // iOS only: also backup to AsyncStorage
  if (Platform.OS === 'ios') {
    const asyncSuccess = await setToAsyncStorage(installId);
    console.log('[IAP:iOS] New installId stored - SecureStore:', secureSuccess, 'AsyncStorage:', asyncSuccess);
  }
  
  console.log('[IAP] Generated new installId:', installId);
  return installId;
}

export async function clearInstallId(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(INSTALL_ID_KEY);
    } else {
      // Clear both stores
      try {
        await SecureStore.deleteItemAsync(INSTALL_ID_KEY);
      } catch (e) {
        console.error('[IAP] Error clearing SecureStore:', e);
      }
      try {
        await AsyncStorage.removeItem(ASYNC_INSTALL_ID_KEY);
      } catch (e) {
        console.error('[IAP] Error clearing AsyncStorage:', e);
      }
    }
    console.log('[IAP] Cleared installId');
  } catch (error) {
    console.error('[IAP] Error clearing installId:', error);
  }
}

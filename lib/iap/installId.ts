import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const INSTALL_ID_KEY = 'echoes_install_id';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getInstallId(): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      let installId = localStorage.getItem(INSTALL_ID_KEY);
      if (!installId) {
        installId = generateUUID();
        localStorage.setItem(INSTALL_ID_KEY, installId);
        console.log('[IAP] Generated new installId (web):', installId);
      }
      return installId;
    }

    let installId = await SecureStore.getItemAsync(INSTALL_ID_KEY);
    
    if (!installId) {
      installId = generateUUID();
      await SecureStore.setItemAsync(INSTALL_ID_KEY, installId);
      console.log('[IAP] Generated new installId:', installId);
    } else {
      console.log('[IAP] Retrieved existing installId:', installId);
    }
    
    return installId;
  } catch (error) {
    console.error('[IAP] Error accessing secure storage:', error);
    const fallbackId = generateUUID();
    console.log('[IAP] Using fallback installId:', fallbackId);
    return fallbackId;
  }
}

export async function clearInstallId(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(INSTALL_ID_KEY);
    } else {
      await SecureStore.deleteItemAsync(INSTALL_ID_KEY);
    }
    console.log('[IAP] Cleared installId');
  } catch (error) {
    console.error('[IAP] Error clearing installId:', error);
  }
}

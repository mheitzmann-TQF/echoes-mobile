import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getInstallId } from './installId';

const SESSION_TOKEN_KEY = 'echoes_session_token';
const SESSION_EXPIRES_KEY = 'echoes_session_expires';

const API_BASE = 'https://source.thequietframe.com';

interface SessionData {
  token: string;
  expiresAt: Date;
}

let cachedSession: SessionData | null = null;
let pendingSessionRequest: Promise<SessionData | null> | null = null;

function getAppVersion(): string {
  const expoConfig = Constants.expoConfig || Constants.manifest;
  return (expoConfig as any)?.version || '1.0.0';
}

async function getStoredSession(): Promise<SessionData | null> {
  try {
    if (Platform.OS === 'web') {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      const expiresStr = localStorage.getItem(SESSION_EXPIRES_KEY);
      if (token && expiresStr) {
        return { token, expiresAt: new Date(expiresStr) };
      }
      return null;
    }

    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    const expiresStr = await SecureStore.getItemAsync(SESSION_EXPIRES_KEY);
    
    if (token && expiresStr) {
      return { token, expiresAt: new Date(expiresStr) };
    }
    return null;
  } catch (error) {
    console.error('[SESSION] Error reading stored session:', error);
    return null;
  }
}

async function storeSession(session: SessionData): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(SESSION_TOKEN_KEY, session.token);
      localStorage.setItem(SESSION_EXPIRES_KEY, session.expiresAt.toISOString());
      return;
    }

    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, session.token);
    await SecureStore.setItemAsync(SESSION_EXPIRES_KEY, session.expiresAt.toISOString());
    console.log('[SESSION] Stored session, expires:', session.expiresAt.toISOString());
  } catch (error) {
    console.error('[SESSION] Error storing session:', error);
  }
}

async function clearStoredSession(): Promise<void> {
  try {
    cachedSession = null;
    if (Platform.OS === 'web') {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_EXPIRES_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    await SecureStore.deleteItemAsync(SESSION_EXPIRES_KEY);
    console.log('[SESSION] Cleared stored session');
  } catch (error) {
    console.error('[SESSION] Error clearing session:', error);
  }
}

function isSessionValid(session: SessionData | null): boolean {
  if (!session) return false;
  
  const now = new Date();
  const hoursUntilExpiry = (session.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilExpiry > 1;
}

async function requestNewSession(installId: string): Promise<SessionData | null> {
  try {
    console.log('[SESSION] Requesting new session for installId:', installId);
    
    const response = await fetch(`${API_BASE}/api/session/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        installId,
        platform: Platform.OS,
        appVersion: getAppVersion(),
        deviceTime: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SESSION] Failed to start session:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[SESSION] Received session response:', { 
      hasToken: !!data.sessionToken, 
      expiresAt: data.expiresAt 
    });

    if (!data.sessionToken || !data.expiresAt) {
      console.error('[SESSION] Invalid session response - missing token or expiry');
      return null;
    }

    const session: SessionData = {
      token: data.sessionToken,
      expiresAt: new Date(data.expiresAt),
    };

    await storeSession(session);
    cachedSession = session;
    
    return session;
  } catch (error) {
    console.error('[SESSION] Error requesting session:', error);
    return null;
  }
}

export async function ensureSession(): Promise<string | null> {
  if (cachedSession && isSessionValid(cachedSession)) {
    return cachedSession.token;
  }

  const storedSession = await getStoredSession();
  if (storedSession && isSessionValid(storedSession)) {
    cachedSession = storedSession;
    return storedSession.token;
  }

  // Deduplicate concurrent session requests
  if (pendingSessionRequest) {
    console.log('[SESSION] Request already in progress, waiting...');
    const result = await pendingSessionRequest;
    return result?.token || null;
  }

  const installId = await getInstallId();
  
  pendingSessionRequest = requestNewSession(installId);
  try {
    const newSession = await pendingSessionRequest;
    return newSession?.token || null;
  } finally {
    pendingSessionRequest = null;
  }
}

export async function getSessionToken(): Promise<string | null> {
  if (cachedSession && isSessionValid(cachedSession)) {
    return cachedSession.token;
  }

  const storedSession = await getStoredSession();
  if (storedSession && isSessionValid(storedSession)) {
    cachedSession = storedSession;
    return storedSession.token;
  }

  return null;
}

export async function refreshSession(): Promise<string | null> {
  // If a session request is already pending, wait for it
  if (pendingSessionRequest) {
    console.log('[SESSION] Refresh waiting for pending request...');
    const result = await pendingSessionRequest;
    return result?.token || null;
  }
  
  await clearStoredSession();
  
  const installId = await getInstallId();
  
  pendingSessionRequest = requestNewSession(installId);
  try {
    const newSession = await pendingSessionRequest;
    return newSession?.token || null;
  } finally {
    pendingSessionRequest = null;
  }
}

export async function clearSession(): Promise<void> {
  await clearStoredSession();
}

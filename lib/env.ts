// lib/env.ts
// Single source of truth for env values (Expo app + Expo Router API routes)

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:5000";

export const TQF_API_KEY =
  process.env.EXPO_PUBLIC_TQF_API_KEY ??
  process.env.TQF_API_KEY ??
  "";

// Log once at runtime (safe: doesn't print full key)
let didLog = false;

export function logEnvOnce(tag: string = "ENV") {
  if (didLog) return;
  didLog = true;

  const key = TQF_API_KEY;
  const keyPreview = key
    ? `${key.slice(0, 4)}…${key.slice(-4)} (len=${key.length})`
    : "MISSING";

  console.log(`🔐 ${tag}:`, {
    API_URL,
    TQF_API_KEY: keyPreview,
    EXPO_PUBLIC_API_URL_present: Boolean(process.env.EXPO_PUBLIC_API_URL),
    EXPO_PUBLIC_TQF_API_KEY_present: Boolean(process.env.EXPO_PUBLIC_TQF_API_KEY),
  });
}
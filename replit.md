# Echoes - The Quiet Frame

## Recent Changes (February 2026)
- **Version bump to 1.2.0** for fresh EAS build with IAP provisioning profile.
- **Subscription disclosure text** added to Paywall (Apple-required auto-renewal terms, platform-specific for iOS/Android).
- **Disclosure translations** added to all 6 supported languages.
- **Fixed duplicate JSON key** in en.json (`articlesAnalyzed`).

## Changes (January 2026)
- **Dynamic Preview Period:** Preview days now controlled by backend `previewDays` field instead of hardcoded constants. Setting `previewDays: 0` hides all trial messaging (useful for internal testing).
- **Removed Hardcoded Trial Constants:** `HAS_TRIAL_OFFER` and `TRIAL_DAYS` removed from products.ts - now fully backend-driven.
- **iOS Splash Screen:** Removed (now solid black for faster loading).
- **App Icon:** Updated to full tree logo, properly sized.
- **Paywall UI:** Removed yellow warning banner when products don't load; cleaner experience.
- **IAP Diagnostics:** Added connection status display, automatic retry with exponential backoff, manual reconnect button in debug panel.

## Overview
Echoes is a cross-platform mobile application (iOS/Android) built with React Native and Expo. It delivers contextual awareness aligned with planetary rhythms, cultural calendars, and media climate patterns through "echo cards." The app provides location-aware, time-sensitive content without user accounts or personal data collection, focusing on observational language to ensure App Store compliance. Its purpose is to provide insights based on lunar phases, solar patterns, geomagnetic activity, global consciousness metrics, and cultural calendar systems.

## User Preferences
- Preferred communication style: Simple, everyday language
- No SaaS vocabulary in user-facing text (no "upgrade", "unlock", "premium", "pro")
- Subscription model uses "full access" and "continue" terminology

## Content Philosophy
- **Core principle:** "Anchors may interpret, contextualize, relativize — but must NEVER prescribe."
- **User positioning:** Users are conscious witnesses inside larger systems, not reactors who need to optimize.
- **The test:** After any tab, ask "Do I need to do something now?" If "no" and feeling is "I see" — the app succeeds.
- **Language style:** All UI text uses observational framing (e.g., "Energy often present" not "Good for tasks").

## System Architecture

### Mobile Application Framework
Built using React Native with Expo SDK and TypeScript. UI animations are handled with React Native Reanimated and Gesture Handler.

### Navigation and UI/UX
The app features five primary tabs: Today, Pulse, Wisdom, Upcoming, and Settings. Swipeable tab navigation is implemented using `react-native-pager-view` with a custom `SwipeTabs` component, providing haptic feedback and platform-specific safe area handling. A dual theme architecture supports comprehensive dark and light modes, with dynamic detection of device preferences and manual override. An "Interruption Layer" is presented on app open to reduce manufactured urgency, displaying brief messages with tiered presentation based on user exposure.

### State Management and Data
Global state is managed using React Contexts (e.g., `LocationContext`, `ThemeContext`). The application adopts a local-first data storage approach, storing data locally on the device without user accounts.

### Content and Features
- **Calendar Integration:** Displays multi-calendar dates (e.g., Hebrew calendar) with detailed modals showing significance, energy, phase, and element. All calendar data is aggregated from the TQF API.
- **Media Climate:** Presents raw and filtered signal analysis of global media patterns.
- **"The Cookie":** A daily AI-generated fictional reflection prompt, displayed on the Wisdom tab.
- **Ancient Wisdom:** Daily guidance from ancient calendar traditions (Hebrew, Mayan, Chinese, Hindu, Islamic).
- **Dynamic Wisdom Cards:** Server-controlled cards that can be enabled/disabled from source.thequietframe.com without app updates. Used for introducing new features (e.g., "Space" app). See `docs/DYNAMIC_CARDS_API.md` for API contract.
- **In-App Purchase & Subscription:** Uses a "full access" subscription model (monthly/yearly) managed through `expo-iap` with backend verification via source.thequietframe.com. See detailed IAP documentation below.

### Tab Content Structure
Each tab has a distinct purpose aligned with the content philosophy:
- **Today (index.tsx):** Presence anchoring only — Daily Photo + Multi-Calendar View + Metrics Grid. No interpretive content.
- **Pulse (pulse.tsx):** Location-based impact patterns and observational context.
- **Wisdom (wisdom.tsx):** Perspective & meaning — Cookie (reflection prompt) → Ancient Wisdom → Media Climate analysis. Order reflects journey from personal reflection to cultural wisdom to media awareness.
- **Upcoming (upcoming.tsx):** Future patterns and observances.
- **Settings (settings.tsx):** User preferences, language, theme, subscription management.

### API Integration
All content and billing information is fetched directly from `source.thequietframe.com` via HTTPS. The mobile app acts as a client, never directly accessing databases. Public endpoints are unauthenticated, while protected billing endpoints require session token authentication for security. A cache-first strategy with `expires_at` timestamps is employed.

### Internationalization
The app supports 6 languages (en, es, fr, pt, de, it) with automatic device language detection, manual override, and AsyncStorage persistence.

## External Dependencies

### Primary External Services
- **The Quiet Frame (TQF) Planetary Awareness API:** `https://source.thequietframe.com` for all content, planetary data, consciousness metrics, cultural calendars, AI-generated wisdom, and billing services.
- **Expo Platform Services:** Expo Go, Expo Location, Expo Localization, EAS for builds.

### Third-Party Libraries
- **UI & Animation:** `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `@react-navigation`, `react-native-pager-view`.
- **Utility Libraries:** `lucide-react-native`, `expo-haptics`, `react-native-safe-area-context`, `i18next`, `react-i18next`.
- **In-App Purchases:** `expo-iap`, `expo-secure-store`.

### Required Secrets (Replit Secrets for Backend Billing on source.thequietframe.com)
- `APPLE_IAP_PRIVATE_KEY`, `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_BUNDLE_ID`, `APPLE_ENV`
- `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_PACKAGE_NAME`

## In-App Purchase Implementation

### Architecture Overview
The app uses a server-verified subscription model where all entitlement decisions are made by the backend (source.thequietframe.com). The mobile app handles store interactions (StoreKit 2 for iOS, Google Play Billing for Android) while the backend verifies receipts and manages subscription state.

### Key Files
- `lib/iap/useEntitlement.ts` - Main entitlement context and hook (session management, status checking, purchase flow)
- `lib/iap/iap.ts` - Low-level expo-iap wrapper (store connection, product fetching, purchase execution)
- `lib/iap/products.ts` - Product SKUs and pricing constants
- `lib/iap/sessionManager.ts` - Session token management with secure storage
- `components/Paywall.tsx` - Subscription UI with dynamic pricing

### Session Authentication Flow
1. App launches → calls `POST /api/session/start` with `{ installId, platform }` (no auth needed)
2. Backend returns `{ sessionToken, expiresAt, refreshAfter }`
3. Token stored securely via `expo-secure-store`
4. All billing API calls use `Authorization: Bearer <sessionToken>`
5. Token auto-refreshes when expired

### Entitlement States
- **full** - User has active subscription or is within preview period
- **free** - No active subscription, preview period expired

### Dynamic Preview Period (Backend-Controlled)
The preview period is controlled entirely by the backend via the `previewDays` field in `/api/billing/status`:

```json
{
  "entitlement": "free",
  "expiresAt": null,
  "previewDays": 3
}
```

**Behavior:**
- `previewDays: 0` → Paywall shows "Subscribe" (no trial messaging) - useful for internal testing
- `previewDays: 3` → Paywall shows "Start 3-day access" with trial note
- `previewDays: 7` → Paywall shows "Start 7-day access" with trial note

This allows changing preview periods without app updates. The store's own free trials (Apple 3-day, Google 7-day) are separate and offered as additional benefits during subscription purchase.

### Product SKUs
- **Bundle ID:** `com.ignea.thequietframe`
- **Monthly:** `com.thequietframe.echoes.monthly` ($7.99/month)
- **Yearly:** `com.thequietframe.echoes.yearly` ($79.99/year)

Prices display in local currency when StoreKit/Google Play is connected (e.g., CHF for Swiss users).

### Purchase Flow
1. User taps "Start X-day access" or "Subscribe"
2. App calls store's purchase API via expo-iap
3. Store returns receipt/transaction
4. App sends receipt to `POST /api/billing/verify` with session token
5. Backend verifies with Apple/Google servers
6. Backend updates entitlement status
7. App refreshes entitlement from `GET /api/billing/status`
8. Paywall auto-closes on success

### Debug Panel
Access by tapping the Settings area 5 times. Shows:
- IAP connection status (connected/disconnected)
- Current entitlement state
- Console logs for debugging
- Manual reconnect button for StoreKit

### Known Issues & Troubleshooting

**iOS StoreKit Sandbox Issues:**
- StoreKit 2 sandbox can get "stuck" requiring manual intervention
- Fix: Settings → Developer → Reset Media Services, then restart app
- Products may show USD fallback prices when StoreKit not fully connected
- Use the debug panel's reconnect button to retry connection

**Android:**
- IAP works more reliably than iOS sandbox
- Ensure test account is added in Google Play Console

### Grace Period Logic
If backend is temporarily unavailable:
1. Check if user had recent valid access (cached)
2. Grant temporary grace period (prevents lockout during outages)
3. Re-verify when backend becomes available

### Dev Mode Testing
- Debug panel allows simulating entitlement states without real purchases
- Backend can return `previewDays: 0` for internal testing accounts
- Dev access override available for testing without real IAP transactions
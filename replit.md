# Echoes - The Quiet Frame

## Overview
Echoes is a cross-platform mobile application (iOS/Android) built with React Native and Expo. Its core purpose is to deliver contextual awareness aligned with planetary rhythms, cultural calendars, and media climate patterns. The app presents "echo cards" based on lunar phases, solar patterns, geomagnetic activity, global consciousness metrics, and cultural calendar systems. It provides location-aware, time-sensitive content without requiring user accounts or collecting personal data.

**Critical Design Principle:** All content uses observational language (like weather reporting) without mystical, spiritual, or predictive claims. This ensures App Store compliance and defensible vocabulary.

## User Preferences
- Preferred communication style: Simple, everyday language
- No SaaS vocabulary in user-facing text (no "upgrade", "unlock", "premium", "pro")
- Subscription model uses "full access" and "continue" terminology

## Recent Changes (January 2026)

### Vocabulary Overhaul
- Removed all forbidden SaaS terms from 6 locale files
- Subscription uses "Continue with full access" not "Upgrade"
- "Initial Access" instead of "Free tier"
- "Full Access" instead of "Pro/Premium"

### Paywall Features Updated
The paywall now displays:
- Full access to Pulse and Wisdom
- Media Climate: Raw + Filtered Signal
- Ways of marking time (all calendars)
- Upcoming timing windows (when available)

Subtitle: "Full access across Pulse, Wisdom, and Upcoming."

### Legal Pages
- Terms of Service: `/api/legal/terms` (also at thequietframe.com/terms for App Store)
- Privacy Policy: `/api/legal/privacy` (also at thequietframe.com/privacy for App Store)
- Contact: hey@thequietframe.com
- Effective date: February 26, 2026

### Dev Access Override (Testing)
For iOS Simulator testing without real IAP or DATABASE_URL:
- In dev mode (`__DEV__` + simulator), app defaults to `trial` state without calling backend
- Long-press version label in Settings (5 presses) to reveal dev toggle
- Cycles through: none → trial → paid → expired → none
- Visual "DEV: {state}" indicator when active
- Purchase buttons in Paywall simulate upgrade by setting local state to `paid`
- Backend calls (`/api/billing/status`, `/api/billing/verify`) are completely bypassed
- StoreKit is not initialized in dev mode
- Files: `lib/iap/devAccessOverride.ts`, `lib/iap/useEntitlement.ts`

## System Architecture

### Navigation Tabs
1. **Today** - Daily echo cards, calendar confluence, lunar wisdom
2. **Pulse** - Media climate, raw + filtered signal analysis
3. **Wisdom** - Patterns and contextual insights
4. **Upcoming** - Timing windows, astronomical events, cultural observances
5. **Settings** - Location, theme, language, subscription management

### Mobile Application Framework
Built using **React Native with Expo SDK**, leveraging **Expo Router** for navigation and **TypeScript** for type safety. UI animations are handled with **React Native Reanimated** and **Gesture Handler**.

### State Management
Global state is managed using **React Contexts**: `LocationContext` for handling user location, timezone, and language, and `ThemeContext` for dark/light theme management. Data is stored locally on the device, with no user accounts, ensuring a **local-first data storage** approach.

### Component Design
The app employs a modular component structure:
- `EchoCard` - Wisdom messages with swipe navigation
- `MoonPhase` - SVG-based lunar visualizations
- `CalendarCarousel` - Multi-calendar displays with tap-to-expand detail modals
- `MetricsGrid` - Planetary and media climate data
- `Paywall` - Subscription UI with full access features
- `PausedOverlay` - Shown on paused tabs (Pulse, Wisdom, Upcoming) when access expires

### Calendar Detail Modal
Tapping any calendar card on the Today tab opens a detail modal showing:
- Calendar name and current date
- Calendar type (Civil, Sacred, Lunisolar, Lunar)
- Significance - What this day means in that calendar system
- Energy - The quality of the day
- Phase - Current lunar or seasonal phase
- Element - For calendars that track elemental associations (e.g., Chinese)

### Hebrew Calendar Implementation
Hebrew calendar dates come from the TQF API (`source.thequietframe.com/api/planetary/traditional-calendars`):
- No separate Hebcal API call needed - TQF aggregates this data
- Jewish holidays are fetched from source.thequietframe.com (no local database)
- Calendar detection handles all language variants: hebrew (EN), hébr (FR), hebre (ES/PT), ebraico (IT), hebräisch (DE)
- All 6 calendars have localized names in all 6 supported languages

### API Integration
The app fetches all content **directly from `source.thequietframe.com`** (no proxy layer):

**Content Endpoints (public, no auth required):**
- `/api/echoes/daily-bundle` - Daily echo cards and planetary context
- `/api/planetary/traditional-calendars` - Multi-calendar dates
- `/api/planetary/biological-rhythms` - Circadian data
- `/api/planetary/events` - Upcoming astronomical events
- `/api/consciousness/*` - Media climate data
- `/api/important-dates/upcoming` - Cultural observances
- `/api/cookie` - Daily wisdom cookie

**Architecture:**
- `lib/api/contentClient.ts` - Direct fetch to source.thequietframe.com
- All endpoints are public (no API key required)
- Cache-first strategy with `expires_at` timestamps

### Theme System
A **dual theme architecture** supports comprehensive dark and light modes, with dynamic detection of device preferences and manual override options.

### Content Generation
Echo cards are categorized into Lunar, Solar, Global Consciousness, Cultural Rhythms, and Ancestral Echo. The backend API at source.thequietframe.com assigns relevance scores based on astronomical conditions and user context. A daily fictional reflection prompt, "The Cookie," is fetched from source.thequietframe.com for contemplative purposes, explicitly marked as fictional content.

**Note:** The mobile app and Express server do NOT use OpenAI directly. All AI-generated content is produced at source.thequietframe.com and fetched via API.

## In-App Purchase & Subscription System

### Monetization Model
The app uses a "full access" subscription model (not "Pro" or "Premium"):

**Pricing:**
- Monthly: $7.99/month
- Yearly: $79.90/year (~2 months free)
- 3-day initial access period (configured in store consoles)

**Access States:**
- `none` - No access, paywall shown on Pulse/Wisdom/Upcoming
- `trial` - Initial access period active
- `paid` - Active subscription
- `expired` - Subscription lapsed, tabs paused

### Architecture
- Client-side: `lib/iap/` contains products.ts, installId.ts, iap.ts, useEntitlement.ts, devAccessOverride.ts
- Backend: All billing endpoints live on `source.thequietframe.com` (not in this mobile repo)

**Critical Architecture Principle:**
The mobile app NEVER directly accesses databases. All flows go through source.thequietframe.com:
```
Echoes (mobile) → HTTPS to source.thequietframe.com → source queries DB → JSON back to app
```
This ensures:
- Database secrets stay out of the mobile app
- Single database authority (source.thequietframe.com)
- Production and simulator behavior are identical

**Session Token Authentication:**
Protected endpoints (billing/status, billing/verify) require a session token:
1. App calls `POST /api/session/start` with `installId`, `platform`, `appVersion`
2. Source returns `sessionToken` (24h validity) stored in SecureStore
3. App sends `Authorization: Bearer <token>` on protected requests
4. Session auto-refreshes when near expiry

Public endpoints (daily-bundle, calendars, observances) remain unauthenticated.

Key files:
- `lib/iap/sessionManager.ts` - Token lifecycle (ensure, store, refresh)
- `lib/iap/useEntitlement.ts` - Calls `ensureSession()` before protected API calls

### Required Secrets (Replit Secrets)

**Apple App Store Server API:**
- `APPLE_IAP_PRIVATE_KEY` - PEM-encoded private key from App Store Connect > Keys > In-App Purchase
- `APPLE_IAP_KEY_ID` - Key ID from the same location
- `APPLE_IAP_ISSUER_ID` - Issuer ID from App Store Connect
- `APPLE_BUNDLE_ID` - App bundle ID (default: com.thequietframe.echoes)
- `APPLE_ENV` - 'sandbox' or 'production' (default: auto-detected from NODE_ENV)

**Google Play Developer API:**
- `GOOGLE_SERVICE_ACCOUNT_KEY` - Full JSON of service account credentials
- `GOOGLE_PACKAGE_NAME` - App package name (default: com.thequietframe.echoes)

### Key IAP Files
- `lib/iap/products.ts` - Product IDs, pricing, legal URLs
- `lib/iap/sessionManager.ts` - Session token lifecycle with SecureStore
- `lib/iap/useEntitlement.ts` - React hook for access state with dev override support
- `lib/iap/devAccessOverride.ts` - Dev-only subscription state override for testing
- `components/Paywall.tsx` - Subscription paywall UI

Note: Billing verification endpoints (`appleVerify.ts`, `googleVerify.ts`) live on source.thequietframe.com, not in this repo.

## External Dependencies

### Primary External Services
- **The Quiet Frame (TQF) Planetary Awareness API:** `https://source.thequietframe.com` provides planetary data, consciousness metrics, cultural calendar info, AI-generated wisdom (including "The Cookie"), and all content endpoints. Uses API key authentication (server-side proxy only).
- **Expo Platform Services:** Expo Go, Expo Location, Expo Localization, EAS for builds.

### Third-Party Libraries
- **UI & Animation:** `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `@react-navigation`
- **Utility Libraries:** `lucide-react-native`, `expo-haptics`, `react-native-safe-area-context`
- **Development Tools:** TypeScript, Babel, Expo Metro bundler
- **In-App Purchases:** `expo-iap`, `expo-secure-store`
- **Internationalization:** `i18next`, `react-i18next` for multilingual support

### Internationalization (i18n)
The app supports **6 languages**: English (en), Spanish (es), French (fr), Portuguese (pt), German (de), and Italian (it).

**Architecture:**
- `lib/i18n.ts` - i18n configuration with language detection and AsyncStorage persistence
- `lib/locales/*.json` - Translation files for each supported language

**Key Features:**
- Automatic device language detection via `expo-localization`
- Manual language override with persistence via AsyncStorage
- Language selector in Settings screen
- Fallback to English for unsupported languages

**Usage:**
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// Use: t('settings.title')
```

**Translation Key Structure for Subscription:**
- `settings.exploreAccess` - "Explore all tabs and features"
- `settings.continueWithFullAccess` - "Continue with full access"
- `paywall.continue` - "Continue with Echoes"
- `paywall.startAccess` - "Start {{days}}-day access"
- `paywall.accessNote` - Trial/subscription note
- `paywall.features.*` - Feature list items

## App Store Submission Checklist

### Before Submission
1. Mirror legal pages at thequietframe.com/terms and /privacy
2. Configure IAP products in App Store Connect and Google Play Console
3. Add sandbox testers for iOS testing
4. Verify all translations render correctly (clear Metro cache if needed: `npx expo start --clear`)

### Vocabulary Requirements
- No mystical/spiritual claims
- Observational language only (like weather reporting)
- "Full access" not "Premium/Pro"
- "Continue" not "Upgrade/Unlock"
- "Initial access" not "Free trial" (when referring to non-trial periods)

# Echoes — The Quiet Frame: Comprehensive Manual

**App Version:** 1.1.0
**Document Version:** February 2026
**iOS Bundle ID:** `com.ignea.thequietframe`
**Android Package:** `com.thequietframe.echoes`
**IAP Product Prefix:** `com.thequietframe.echoes`
**Backend API:** `https://source.thequietframe.com`

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Content Philosophy](#2-content-philosophy)
3. [Features & Functionality](#3-features--functionality)
4. [Technical Architecture](#4-technical-architecture)
5. [Design System](#5-design-system)
6. [API Integration](#6-api-integration)
7. [Subscription & Billing](#7-subscription--billing)
8. [Internationalization](#8-internationalization)
9. [Build & Deployment](#9-build--deployment)
10. [Maintenance Guide](#10-maintenance-guide)
11. [Troubleshooting](#11-troubleshooting)
12. [Enhancement Ideas](#12-enhancement-ideas)

---

## 1. Product Overview

### What Is Echoes?

Echoes is a cross-platform mobile application (iOS and Android) that delivers contextual awareness aligned with planetary rhythms, cultural calendars, and media climate patterns. It presents "echo cards" — location-aware, time-sensitive content snippets — without user accounts or personal data collection.

### What Echoes Is NOT

- Not astrology (though it tracks celestial patterns)
- Not a wellness app (no self-improvement language)
- Not spiritual guidance (observational, not prescriptive)
- Not news analysis (it surfaces patterns, not opinions)

### Who Uses It

Anyone curious about planetary rhythms, cultural traditions, and global patterns. Users are positioned as **conscious witnesses** inside larger systems — not reactors who need to optimize.

### What Success Looks Like

After using any tab, the user should think: "Do I need to do something now?" If the answer is "no" and the feeling is "I see" — the app succeeds.

---

## 2. Content Philosophy

### Core Principle

> "Anchors may interpret, contextualize, relativize — but must NEVER prescribe."

### Language Rules

| Rule | Example (Wrong) | Example (Right) |
|------|-----------------|-----------------|
| Observe, don't prescribe | "Good for tasks" | "Energy often present" |
| No urgency | "Act now!" | "Patterns emerging" |
| No SaaS vocabulary | "Upgrade to Premium" | "Continue with full access" |
| Left-aligned text | Centered body text | Left-aligned body text |
| No italics in card content | *Italicized note* | Regular weight note |

### Vocabulary Guide

| Never Use | Use Instead |
|-----------|-------------|
| Premium, Pro | Full access |
| Upgrade, Unlock | Continue |
| Subscribe (as a call to action) | Start X-day access |
| Breaking, Alert | Elevated, Present |
| Optimize your day | Energy often observed |

---

## 3. Features & Functionality

### 3.1 App Navigation

The app has **five tabs**, navigated by swiping left/right or tapping the bottom tab bar:

| Tab | Purpose | File |
|-----|---------|------|
| Today | Presence anchoring — what's happening now | `app/index.tsx` |
| Pulse | Location-based impact patterns | `app/pulse.tsx` |
| Wisdom | Perspective and meaning | `app/wisdom.tsx` |
| Upcoming | Future patterns and observances | `app/upcoming.tsx` |
| Settings | Preferences, language, theme, subscription | `app/settings.tsx` |

Navigation uses **Expo Router** (file-based routing in `app/` directory) with a custom `SwipeTabs` component (`components/SwipeTabs.tsx`) built on `react-native-pager-view` for swipeable tab transitions. On web and Expo Go, a standard Expo Router tab navigator is used instead. Each swipe triggers haptic feedback via `expo-haptics`. The bottom tab bar is custom-rendered in `app/_layout.tsx`.

### 3.2 Today Tab

**Purpose:** Pure presence anchoring. No interpretive content.

**Content:**
- **Daily Photo** — Full-width image from the TQF API (sourced from Unsplash). Tappable for fullscreen view. Photographer credited with link.
- **Multi-Calendar Carousel** — Horizontal swipeable calendar cards showing today's date in multiple calendar systems (Hebrew, Mayan, Chinese, Hindu, Islamic). Tapping a card opens a detail modal with significance, energy, phase, and element.
- **Metrics Grid** — Quick-reference grid showing current lunar phase, solar activity, geomagnetic status, and other daily data points.
- **Today's Observances** — List of cultural and astronomical events happening today.

**Data Source:** `/api/echoes/daily-bundle`, `/api/echoes/today-events`

### 3.3 Pulse Tab

**Purpose:** Location-based observational context about planetary impact patterns.

**Content:**
- **Hero Timing Card** — Optimal timing suggestions based on current planetary alignment (expanded by default for immediate value).
- **Expandable Cards** — Collapsible sections for:
  - **Lunar Data** — Current moon phase, illumination, position. Accent color: `#A78BFA` (purple).
  - **Solar Data** — Solar activity, UV index, active regions. Accent color: `#F59E0B` (amber).
  - **Geomagnetic Data** — Kp index, storm level, impact notes. Accent color: `#14B8A6` (teal).
  - **Circadian/Body Rhythms** — Biological rhythm context. Accent color: `#34D399` (emerald).
- **Pulse Snapshot** — Summary metrics: coherence, circadian phase, geomagnetic level.
- **Input Signals** — Source attribution for the data being displayed.
- **Companion Context** — Location-aware contextual narrative.

**Data Source:** `/api/echoes/daily-bundle`, `/api/echoes/instant`, `/api/planetary/biological-rhythms`, `/api/planetary/optimal-timing`, `/api/consciousness/current`, `/api/companion/context`

**Requires:** Location permission (or manual location input from Settings).

### 3.4 Wisdom Tab

**Purpose:** Perspective and meaning — the journey from personal reflection to cultural wisdom to media awareness.

**Content (in order):**
1. **The Cookie** — A daily AI-generated fictional reflection prompt. Example: *"In a forest that remembers every footstep, a cartographer discovers that the most accurate maps are drawn by those who walk with their eyes closed."* Subtitle: "A fact with a wink." Cached daily per language.
2. **Ancient Wisdom Cards** — Daily guidance from five ancient calendar traditions:
   - Hebrew (accent: `#60A5FA`)
   - Mayan (accent: `#FB923C`)
   - Chinese (accent: `#F87171`)
   - Hindu (accent: `#FBBF24`)
   - Islamic (accent: `#4ADE80`)
3. **Global Consciousness** — TQF Gauge and percentage bar showing global coherence metrics, with regional breakdown data.
4. **Media Climate** — Raw and filtered signal analysis of global media patterns.
5. **Dynamic Wisdom Cards** — Server-controlled cards that can be enabled/disabled from the backend without app updates. Used for introducing new features (e.g., the "Space" companion app).

**Data Source:** `/api/cookie`, `/api/wisdom/all`, `/api/consciousness/current`, `/api/consciousness-analysis/raw-analysis`, `/api/consciousness-analysis/regional-breakdown`, `/api/wisdom/dynamic-cards`

### 3.5 Upcoming Tab

**Purpose:** Future patterns and observances.

**Content:**
- **Time Band Selector** — Three bands:
  - Soon (next 14 days)
  - Cycle (next 30 days)
  - Season (next 90 days)
- **Category Filter** — Filter by: All, Astronomical, Cultural.
- **Event Cards** — Each event shows name, date, category, and brief description.

**Data Source:** `/api/important-dates/upcoming`

### 3.6 Settings Tab

**Purpose:** User preferences and app management.

**Sections:**
- **Location** — Toggle between current device location and manual input. Displays detected timezone.
- **Display** — Theme selection (Dark / Light / System). Manual toggle with system-auto detection.
- **Language** — Choose from 6 languages (see [Internationalization](#8-internationalization)). Persisted via AsyncStorage.
- **Subscription** — Shows current entitlement status (Free / Full Access). "Continue with full access" button opens Paywall. "Restore purchases" link. Manage subscription link (opens device subscription settings).
- **Legal** — Links to Privacy Policy and Terms of Service at `thequietframe.com`.
- **Contact** — Opens email to contact.
- **About** — App version number and attribution.
- **Diagnostics Panel** (hidden) — Accessed by tapping the version number 5 times. Shows Install ID, entitlement status, expiry date, IAP connection status, console logs, and manual reconnect button.

### 3.7 Interruption Layer

On every app open, a brief observational message is displayed as a full-screen overlay before the main content appears. This reduces manufactured urgency and sets the contemplative tone.

**Behavior:**
1. Fetch message from `/api/interruption` (with language and timezone).
2. If fetch fails, use cached message from last successful fetch.
3. If no cached message exists, skip immediately.
4. Display sequence: 300ms pause → 500ms fade in → 4200ms hold → 600ms pause → 600ms fade out.

**Styling:** Centered text (exception to left-align rule), 18px, line-height 28px, max-width 320px, regular weight (400).

### 3.8 Paywall

The Paywall is a modal presented from Settings or when entitlement-gated content is accessed.

**Display Logic:**
- If `previewDays > 0`: Shows "Start X-day access" button with trial note.
- If `previewDays === 0`: Shows "Subscribe" button with no trial messaging.
- Prices display in local currency when StoreKit/Google Play is connected (e.g., CHF for Swiss users). Falls back to USD.
- Two subscription options: Monthly ($7.99) and Yearly ($79.90 — "2 months free").
- Legal links (Terms, Privacy) at the bottom.

### 3.9 Photo of the Day

Full-width daily photograph on the Today tab. Features:
- Tap to view fullscreen.
- Photographer credit with tappable link.
- Unsplash attribution when sourced from Unsplash.
- Smooth image loading with fade-in transition.

---

## 4. Technical Architecture

### 4.1 Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK |
| Language | TypeScript |
| Navigation | Expo Router (file-based), `react-native-pager-view` (swipe tabs) |
| Animations | `react-native-reanimated`, React Native `Animated` |
| Icons | `lucide-react-native` |
| Gestures | `react-native-gesture-handler` |
| Haptics | `expo-haptics` |
| Localization | `i18next`, `react-i18next`, `expo-localization` |
| Secure Storage | `expo-secure-store` |
| Local Storage | `@react-native-async-storage/async-storage` |
| In-App Purchases | `expo-iap` |
| Safe Areas | `react-native-safe-area-context` |
| SVG | `react-native-svg` |

### 4.2 Project Structure

```
app/
├── _layout.tsx          # Root layout, tab config, navigation, providers
├── index.tsx            # Today tab
├── pulse.tsx            # Pulse tab
├── wisdom.tsx           # Wisdom tab
├── upcoming.tsx         # Upcoming tab
├── settings.tsx         # Settings tab
├── api/                 # Expo Router API routes (proxy)

components/
├── AncientWisdomCard.tsx
├── CalendarCarousel.tsx
├── ConsciousnessSummaryCard.tsx
├── ContextChips.tsx
├── DailyAffirmation.tsx
├── DynamicWisdomCard.tsx
├── EchoCard.tsx
├── EchoStack.tsx
├── GlobalCoherence.tsx
├── Hero.tsx
├── InterruptionLayer.tsx
├── MetricsGrid.tsx
├── MoodTemperature.tsx
├── MoonPhase.tsx
├── PausedOverlay.tsx
├── Paywall.tsx
├── SwipeTabs.tsx
├── SwipeTabs.web.tsx

lib/
├── api.ts               # Legacy API functions
├── api/
│   └── contentClient.ts # Modern API client (direct + proxy fallback)
├── ContentService.ts    # Centralized content fetching with 30-min cache
├── CookieService.ts     # Daily Cookie fetching and caching
├── culturalFilter.ts    # Cultural content filtering
├── debug.ts             # Debug utilities
├── env.ts               # Environment variable configuration
├── i18n.ts              # i18next initialization and language management
├── interruptionStore.ts # Interruption message caching
├── labelize.ts          # Data display formatting utilities
├── lang.ts              # Language helpers
├── LocationContext.tsx   # Location state provider
├── PhotoService.ts      # Photo of the Day management
├── ThemeContext.tsx      # Theme state provider
├── useAppState.ts       # App state listener (resume, new day detection)
├── locales/
│   ├── en.json
│   ├── es.json
│   ├── fr.json
│   ├── pt.json
│   ├── de.json
│   └── it.json
├── iap/
│   ├── accessCache.ts    # Grace period and access caching
│   ├── appleVerify.ts    # Apple receipt verification helpers
│   ├── googleVerify.ts   # Google receipt verification helpers
│   ├── iap.ts            # Low-level expo-iap wrapper
│   ├── installId.ts      # Device install ID management
│   ├── iosLogger.ts      # iOS-specific IAP logging
│   ├── products.ts       # Product SKUs and pricing constants
│   ├── sessionManager.ts # Session token lifecycle
│   └── useEntitlement.ts # Main entitlement hook and context

docs/
├── DESIGN_SYSTEM.md
├── DYNAMIC_CARDS_API.md
├── TQF_WEBSITE_BRIEFING.md
└── ECHOES_MANUAL.md      # This document

assets/
├── icon.png             # App icon (full tree logo)
├── adaptive-icon.png    # Android adaptive icon
└── splash.png           # Splash screen image
```

### 4.3 State Management

The app uses React Contexts for global state. No external state library is used.

| Context | File | Purpose |
|---------|------|---------|
| ThemeContext | `lib/ThemeContext.tsx` | Dark/light mode, color tokens |
| LocationContext | `lib/LocationContext.tsx` | Coordinates, timezone, location name |
| EntitlementContext | `lib/iap/useEntitlement.ts` | Subscription status, purchase actions |

**Local storage keys used:**

| Key | Storage | Purpose |
|-----|---------|---------|
| `@tqf_language` | AsyncStorage | Selected language |
| `@location_use_current` | AsyncStorage | Location preference |
| `@location_name` | AsyncStorage | Manual location name |
| `@location_coords` | AsyncStorage | Manual coordinates |
| `@location_timezone` | AsyncStorage | Detected timezone |
| `echoes_install_id` | SecureStore | Device install ID |
| `@echoes_install_id_backup` | AsyncStorage | iOS backup of install ID |
| `echoes_session_token` | SecureStore | Session token |
| `echoes_session_expires` | SecureStore | Session expiry |
| `echoes_access_cache` | AsyncStorage | Last known entitlement |
| `echoes_install_timestamp` | AsyncStorage | First install time |
| `echoes_interruption_state` | AsyncStorage | Cached interruption message |
| `echoes_last_active_date` | AsyncStorage | Last active date (for new-day detection) |
| `echoes_cookie_cache_{lang}` | localStorage | Cached daily Cookie per language |

### 4.4 Data Flow

```
User opens app
  → InterruptionLayer fetches /api/interruption
  → InterruptionLayer displays message or skips
  → Main content loads
    → EntitlementContext initializes:
        1. Get/create Install ID (SecureStore + AsyncStorage backup)
        2. Ensure session token (POST /api/session/start)
        3. Check billing status (GET /api/billing/status)
        4. Initialize IAP store connection (StoreKit 2 / Google Play Billing)
        5. Fetch products
        6. Set up purchase listeners
    → Each tab fetches its data from source.thequietframe.com
    → ContentService caches responses for 30 minutes
    → UI renders with theme-appropriate colors
```

### 4.5 App State Handling

`lib/useAppState.ts` monitors app foregrounding/backgrounding:
- **onResume:** Fires whenever app comes to foreground. Tabs use this to refresh data.
- **onNewDay:** Fires when the app is opened on a different date than last active. Triggers full data refresh and cache invalidation (e.g., new Cookie, new daily bundle).

### 4.6 Content Fetching Strategy

The `contentClient.ts` implements a **direct-first with proxy fallback** pattern:

1. **Web:** Always use proxy (CORS restrictions).
2. **Native (iOS/Android):**
   - Try direct fetch to `https://source.thequietframe.com{endpoint}`.
   - If that fails, fall back to proxy via the Expo API route.
3. **Timeout:** 10 seconds per request.

The `ContentService.ts` wraps this with a **30-minute in-memory cache**. If the API is unreachable, graceful fallback content is provided (e.g., curated cultural artifacts) so users never see blank screens.

---

## 5. Design System

### 5.1 Color Palette — Dark Theme (Default)

| Token | Hex Value | Usage |
|-------|-----------|-------|
| Background | `#000000` | Primary background |
| Surface | `rgba(255,255,255,0.05)` | Card backgrounds |
| Surface Highlight | `rgba(255,255,255,0.1)` | Expanded/active states |
| Text | `#FFFFFF` | Primary text |
| Text Secondary | `rgba(255,255,255,0.6)` | Subtitles, labels |
| Text Tertiary | `rgba(255,255,255,0.4)` | Hints, timestamps |
| Border | `rgba(255,255,255,0.1)` | Card borders, dividers |
| Accent | `#4DB8FF` | Links, interactive elements |
| Accent Subtle | `rgba(77, 184, 255, 0.15)` | Accent backgrounds |
| Error | `#FF453A` | Error states |
| Success | `#32D74B` | Success states |
| Overlay | `rgba(0,0,0,0.85)` | Modal overlays |

### 5.2 Color Palette — Light Theme

| Token | Hex Value | Usage |
|-------|-----------|-------|
| Background | `#F2F2F7` | Primary background |
| Surface | `#FFFFFF` | Card backgrounds |
| Surface Highlight | `#E5E5EA` | Expanded/active states |
| Text | `#000000` | Primary text |
| Text Secondary | `rgba(0,0,0,0.6)` | Subtitles, labels |
| Text Tertiary | `rgba(0,0,0,0.4)` | Hints, timestamps |
| Border | `rgba(0,0,0,0.1)` | Card borders, dividers |
| Accent | `#007AFF` | Links, interactive elements |
| Accent Subtle | `rgba(0, 122, 255, 0.1)` | Accent backgrounds |
| Error | `#FF3B30` | Error states |
| Success | `#34C759` | Success states |
| Overlay | `rgba(0,0,0,0.85)` | Modal overlays |

### 5.3 Semantic Accent Colors

These colors are used as 3px left-border accents on cards to indicate content type:

| Content Type | Color Name | Hex |
|--------------|------------|-----|
| Lunar/Moon | Purple | `#A78BFA` |
| Solar/Sun | Amber | `#F59E0B` |
| Geomagnetic | Teal | `#14B8A6` |
| Circadian/Body | Emerald | `#34D399` |
| Dynamic/Space | Violet | `#8B5CF6` |
| Hebrew Calendar | Blue | `#60A5FA` |
| Mayan Calendar | Orange | `#FB923C` |
| Chinese Calendar | Red | `#F87171` |
| Hindu Calendar | Yellow | `#FBBF24` |
| Islamic Calendar | Green | `#4ADE80` |

### 5.4 Typography

| Element | Font Size | Font Weight | Letter Spacing | Color (Dark) | Color (Light) |
|---------|-----------|-------------|----------------|--------------|----------------|
| Screen Title | 34px | 700 (Bold) | -0.5 | `#FFFFFF` | `#000000` |
| Section Header | 20–22px | 600 (Semi-bold) | — | `#FFFFFF` | `#000000` |
| Modal Title | 18px | 700 (Bold) | — | `#FFFFFF` | `#000000` |
| Card Title | 14–16px | 500–600 | — | `#FFFFFF` | `#000000` |
| Body Text | 14–15px | 400–500 | — | `#FFFFFF` | `#000000` |
| Labels/Captions | 10–12px | 500–600 | — | `rgba(255,255,255,0.6)` | `rgba(0,0,0,0.6)` |
| Section Label (uppercase) | 12px | 600 | 1 | `#FFFFFF` | `#000000` |
| Diagnostics Title | 16px | 700 (Bold) | — | `#F59E0B` | `#F59E0B` |

**Text alignment:** Left-aligned everywhere. Exception: Interruption Layer message is centered.

**Line height:** Typically 1.4–1.5x font size for body text. Interruption Layer uses 28px line-height at 18px font size.

### 5.5 Spacing

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing, inline elements |
| sm | 8px | Icon gaps, small margins |
| md | 12px | Card internal padding, list gaps |
| lg | 16px | Section padding |
| xl | 20px | Screen horizontal padding |
| xxl | 24px | Section gaps |
| xxxl | 32px | Large section separators (e.g., screen title margin-bottom) |

**Screen layout:**
- Horizontal padding: 20px
- Bottom padding: 40px (safe area)
- Card margin-bottom: 12px

### 5.6 Component Specs

**Cards:**
- Background: Surface color
- Border: 1px, Border color
- Border radius: 16px
- Padding: 16px
- Optional left accent bar: 3px width, color per content type

**Expandable Cards:**
- Collapsed: Title + brief value + chevron icon
- Expanded: Full content + "Reading Notes" section
- Chevron rotates on expand/collapse

**Buttons (Link style):**
- Border: 1px with accent color
- Border radius: 8px
- Padding: 12px horizontal, 16px vertical
- Icon: External link icon for outbound links

**Loading States:**
- Skeleton cards with pulsing opacity animation
- Activity indicator (spinner) for screen-level loads
- Splash screen: Centered logo on black (`#000000`) background

### 5.7 Animation Timing

| Animation | Duration |
|-----------|----------|
| Fade in | 500ms |
| Fade out | 600ms |
| Hold pause | 600ms |
| Interruption message display | 4200ms |
| Initial pause (before interruption) | 300ms |
| Layout animation | System default |

### 5.8 Icon System

Uses `lucide-react-native`. Size: 16–24px depending on context. Color follows text hierarchy.

Common icons: Moon, Sun, Globe, Zap, Clock, ChevronDown, ChevronUp, ChevronRight, ExternalLink, Info, MapPin, Sparkles, Crown, RefreshCw, X, Check.

---

## 6. API Integration

### 6.1 Backend

All content and billing data comes from `https://source.thequietframe.com`. The mobile app never accesses databases directly.

### 6.2 Public Content Endpoints (No Auth)

| Endpoint | Purpose | Parameters |
|----------|---------|------------|
| `GET /api/echoes/daily-bundle` | Complete daily data bundle | `lat`, `lng`, `lang`, `tz` |
| `GET /api/echoes/instant` | Real-time planetary data | `lat`, `lng`, `tz` |
| `GET /api/echoes/today-events` | Today's observances | `lang` |
| `GET /api/planetary/traditional-calendars` | Multi-calendar dates | `tz`, `lang`, `lat`, `lng` |
| `GET /api/planetary/biological-rhythms` | Body rhythm data | `tz`, `lat`, `lng` |
| `GET /api/planetary/events` | Planetary events list | `limit`, `lang` |
| `GET /api/planetary/optimal-timing` | Timing suggestions | `tz`, `lang`, `lat`, `lng` |
| `GET /api/consciousness/current` | Global consciousness score | — |
| `GET /api/consciousness-analysis/raw-analysis` | Media climate raw data | `lang` |
| `GET /api/consciousness-analysis/regional-breakdown` | Regional consciousness | — |
| `GET /api/important-dates/upcoming` | Upcoming events | `lang`, `days` |
| `GET /api/cookie` | Daily reflection prompt | `lang` |
| `GET /api/wisdom/all` | All wisdom traditions | `lang` |
| `GET /api/wisdom/cycle` | Wisdom cycle data | `lang`, `date` |
| `GET /api/wisdom/dynamic-cards` | Server-controlled cards | `lang` |
| `GET /api/interruption` | App-open message | `lang`, `timezone` |
| `GET /api/companion/context` | Location-aware narrative | `lat`, `lon`, `lang` |
| `GET /api/sacred-geography/living-calendars` | Living calendar traditions | `lang` |
| `GET /api/cultural/content/high-alignment` | High-alignment cultural content | `limit`, `lang` |
| `GET /api/sacred-geography/sites` | Sacred sites | `lang`, `limit` |
| `GET /api/sacred-geography/ceremonial-timings` | Ceremonial timing data | `lang` |
| `GET /api/sacred-geography/oral-traditions` | Oral traditions | `lang`, `category` |
| `GET /api/sacred-geography/weather-prophecies` | Weather prophecies | `lang` |
| `GET /api/sacred-geography/plant-medicine-timing` | Plant medicine timing | `lang` |

### 6.3 Authenticated Billing Endpoints

These require `Authorization: Bearer <sessionToken>` header.

| Endpoint | Method | Purpose | Body |
|----------|--------|---------|------|
| `/api/session/start` | POST | Create session | `{ installId, platform, appVersion, deviceTime }` |
| `/api/billing/status` | GET | Check entitlement | Query: `installId` |
| `/api/billing/verify` | POST | Verify purchase receipt | `{ installId, platform, sku, transactionId, ... }` |

### 6.4 Web Proxy Routes

For web development, the app uses Expo Router API routes to proxy requests and avoid CORS issues. These live in `app/api/proxy/` and mirror the backend structure:

```
app/api/
├── billing/           # Billing status and verification proxies
├── legal/             # Legal document proxies
├── proxy/
│   ├── consciousness/ # Consciousness data
│   ├── cookie+api.ts  # Daily Cookie
│   ├── cultural/      # Cultural content
│   ├── echoes/        # Daily bundle, instant, today-events
│   ├── important-dates/ # Upcoming events
│   ├── planetary/     # Planetary data, events, timing
│   └── sacred-geography/ # Sacred sites, traditions
```

On native (iOS/Android), requests go directly to `source.thequietframe.com`. The proxy is only used as a fallback if direct requests fail, or always on web.

### 6.5 Caching Strategy

- **ContentService:** 30-minute in-memory cache with `expires_at` respect.
- **CookieService:** Daily cache per language (new Cookie per day, cached in localStorage).
- **InterruptionStore:** Cached message persisted in AsyncStorage for offline fallback.
- **AccessCache:** Last known entitlement state cached in AsyncStorage for grace period logic.

---

## 7. Subscription & Billing

### 7.1 Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌────────────────┐
│  Mobile App  │────▶│  source.thequietframe │────▶│  Apple / Google │
│  (expo-iap)  │     │       .com            │     │    Servers      │
│              │◀────│  (billing backend)    │◀────│                │
└─────────────┘     └──────────────────────┘     └────────────────┘
```

All entitlement decisions are made by the backend. The mobile app handles store interactions (StoreKit 2 for iOS, Google Play Billing for Android). The backend verifies receipts with Apple/Google and manages subscription state.

### 7.2 Product SKUs

| Product | SKU | Price (USD) | Store Trial |
|---------|-----|-------------|-------------|
| Monthly (iOS) | `com.thequietframe.monthly` | $7.99/month | 3-day free |
| Annual (iOS) | `com.thequietframe.annual` | $79.99/year | 3-day free |
| Monthly (Android) | `com.thequietframe.echoes.monthly` | $7.99/month | 3-day free |
| Yearly (Android) | `com.thequietframe.echoes.yearly` | $79.99/year | 3-day free |

Prices display in local currency when the store is connected.

### 7.3 Session Authentication Flow

1. App launches → calls `POST /api/session/start` with `{ installId, platform, appVersion, deviceTime }`.
2. Backend returns `{ sessionToken, expiresAt, refreshAfter }`.
3. Token stored securely via `expo-secure-store` (native) or `localStorage` (web).
4. All billing API calls include `Authorization: Bearer <sessionToken>`.
5. Token auto-refreshes when it has less than 1 hour until expiry.
6. If a 401 is received, session is refreshed and the request retried once.

### 7.4 Install ID

Each device gets a unique Install ID (UUID v4) generated on first launch.

**Storage strategy:**
- **iOS:** Primary in SecureStore, backup in AsyncStorage (iOS Keychain can have issues).
- **Android:** SecureStore only (reliable on Android).
- **Web:** localStorage.

If SecureStore is empty on iOS, AsyncStorage backup is checked before generating a new ID. This prevents accidental identity loss.

### 7.5 Entitlement States

| State | Meaning |
|-------|---------|
| `full` | Active subscription or within preview period |
| `free` | No active subscription, preview period expired |

### 7.6 Dynamic Preview Period

Controlled entirely by the backend via the `previewDays` field in `/api/billing/status`:

```json
{
  "entitlement": "free",
  "expiresAt": null,
  "previewDays": 3
}
```

| `previewDays` Value | Paywall Behavior |
|---------------------|-----------------|
| `0` | Shows "Subscribe" — no trial messaging. Used for internal testing. |
| `3` | Shows "Start 3-day access" with trial note. |
| `7` | Shows "Start 7-day access" with trial note. |

The store's own free trials (configured in App Store Connect / Google Play Console) are separate and offered as additional benefits during purchase.

### 7.7 Purchase Flow

1. User taps "Start X-day access" or "Subscribe" on the Paywall.
2. App calls the store's purchase API via `expo-iap`.
3. Store presents native purchase dialog (Face ID / fingerprint / password).
4. Store returns receipt/transaction to the app.
5. App sends receipt to `POST /api/billing/verify` with session token.
6. Backend verifies with Apple/Google servers.
7. Backend updates entitlement status.
8. App refreshes entitlement from `GET /api/billing/status`.
9. Paywall auto-closes on success.

**Deduplication:** Concurrent verification requests for the same transaction are deduplicated at the module level using a `Map` keyed by `installId:platform:transactionId`.

### 7.8 Restore Purchases

Users can restore purchases from Settings. The flow:
1. App calls `restorePurchases()` via `expo-iap`.
2. Store returns all previous transactions.
3. Each transaction is verified with the backend.
4. If any returns `full` entitlement, access is granted immediately.

**Auto-restore:** When the app detects a subscription has expired, it automatically attempts a restore to check for renewals (with a 1-minute cooldown between attempts).

### 7.9 Grace Period Logic

If the backend is temporarily unavailable, the app uses cached data to prevent lockout:

| Scenario | Grace Duration |
|----------|---------------|
| Fresh install (backend unreachable) | 72 hours |
| Previously had full access (backend unreachable) | 24 hours from last verification |

Grace eligibility is checked via `checkGraceEligibility()` in `accessCache.ts`.

### 7.10 Verification Protection

After a successful purchase verification, a 10-second protection window prevents stale status checks from overwriting the `full` entitlement. This handles the race condition where a status check initiated before the purchase completes could reset access.

### 7.11 Key Files

| File | Purpose |
|------|---------|
| `lib/iap/useEntitlement.ts` | Main entitlement context, hook, and all business logic |
| `lib/iap/iap.ts` | Low-level expo-iap wrapper (store connection, products, purchases) |
| `lib/iap/products.ts` | Product SKUs, pricing constants, store configuration checklist |
| `lib/iap/sessionManager.ts` | Session token lifecycle (create, store, refresh, clear) |
| `lib/iap/installId.ts` | Device Install ID generation and persistence |
| `lib/iap/accessCache.ts` | Grace period logic and access state caching |
| `lib/iap/appleVerify.ts` | Apple-specific verification helpers |
| `lib/iap/googleVerify.ts` | Google-specific verification helpers |
| `lib/iap/iosLogger.ts` | Structured IAP logging for iOS debugging |
| `components/Paywall.tsx` | Subscription UI with dynamic pricing |

---

## 8. Internationalization

### 8.1 Supported Languages

| Code | Language | File |
|------|----------|------|
| `en` | English | `lib/locales/en.json` |
| `es` | Español | `lib/locales/es.json` |
| `fr` | Français | `lib/locales/fr.json` |
| `pt` | Português (Brazilian) | `lib/locales/pt.json` |
| `de` | Deutsch | `lib/locales/de.json` |
| `it` | Italiano | `lib/locales/it.json` |

### 8.2 How It Works

- **Library:** `i18next` with `react-i18next` for React integration.
- **Detection:** On first launch, the device language is detected via `expo-localization`. If it matches a supported language, that language is used. Otherwise, English is the default.
- **Manual Override:** Users can select a language in Settings. The choice is persisted in AsyncStorage under `@tqf_language`.
- **API Integration:** All content endpoints accept a `lang` parameter. The app passes the current language to every API call.
- **Translation Keys:** UI strings use dot-notation keys (e.g., `tabs.today`, `settings.theme`, `paywall.subscribe`). Content from the API arrives pre-translated.

### 8.3 Adding a New Language

1. Create a new locale file: `lib/locales/{code}.json` (copy `en.json` as template).
2. Translate all keys.
3. Add the import to `lib/i18n.ts`.
4. Add the language code to `SUPPORTED_LANGUAGES` array.
5. Add the display name to `LANGUAGE_NAMES` object.
6. Ensure the backend API supports the new `lang` parameter value.

---

## 9. Build & Deployment

### 9.1 Expo Configuration

**File:** `app.json`

| Field | Value |
|-------|-------|
| Name | The Quiet Frame |
| Slug | echoes |
| Version | 1.1.0 |
| Orientation | Portrait |
| iOS Bundle ID | `com.ignea.thequietframe` |
| iOS Display Name | TQF |
| Android Package | `com.thequietframe.echoes` |
| Scheme | `echoes` (for deep links) |
| User Interface Style | dark |
| Non-Exempt Encryption | false |

**Note:** The iOS bundle ID (`com.ignea.thequietframe`) differs from the Android package name (`com.thequietframe.echoes`). IAP product SKUs use the `com.thequietframe.echoes` prefix and are shared across both platforms.

### 9.2 Production Build Optimizations

**Console Log Stripping:**
`babel.config.cjs` uses `babel-plugin-transform-remove-console` to strip all `console.*` calls in production builds, except `console.error`. This reduces bundle size and prevents log leakage.

```javascript
if (process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') {
  plugins.unshift(['transform-remove-console', { exclude: ['error'] }]);
}
```

**Splash Screen:** Solid black (`#000000`) background with centered logo. Kept minimal for fast loading.

### 9.3 Building for Stores

iOS and Android builds are managed through **Expo Application Services (EAS)**. The build configuration is defined in `eas.json`.

**Typical build commands:**
```bash
# Development build (for testing IAP on device)
eas build --platform ios --profile development
eas build --platform android --profile development

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### 9.4 Environment Variables

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `EXPO_PUBLIC_API_URL` | API base URL for web proxy | Expo config |
| `EXPO_PUBLIC_TQF_API_KEY` | TQF API key (if required) | Expo config |
| `API_URL` | Fallback API URL | Process env |
| `TQF_API_KEY` | Fallback API key | Process env |

The app resolves these in `lib/env.ts`, prioritizing `EXPO_PUBLIC_*` variants.

### 9.5 Replit Development Preview

For development in Replit:
- Expo Metro runs on port 8081.
- An Express API server proxies requests on port 5000 (the Replit preview port).
- Start script: `bash scripts/start-dev.sh`.

---

## 10. Maintenance Guide

### 10.1 Common Maintenance Tasks

#### Updating App Version
1. Change `version` in `app.json` → `expo.version`.
2. Update version string in all 6 locale files if displayed in Settings.

#### Changing Preview Period
No app update needed. Update the `previewDays` value returned by the backend at `/api/billing/status`.

#### Adding/Removing a Dynamic Wisdom Card
No app update needed. Update the response from `/api/wisdom/dynamic-cards` on the backend. Set `enabled: false` to hide a card, or remove it from the array. See `docs/DYNAMIC_CARDS_API.md` for the full API contract.

#### Updating Interruption Messages
No app update needed. The message is served from `/api/interruption` on the backend.

#### Updating Cookie Content
No app update needed. The Cookie is AI-generated daily on the backend and served via `/api/cookie`.

#### Changing Subscription Prices
1. Update prices in App Store Connect and/or Google Play Console.
2. Update fallback `PRICING` object in `lib/iap/products.ts` (for when store is not connected).
3. Live prices come from the store, so the fallback is only used as a last resort.

#### Adding a New Calendar System
Requires backend changes to include the new calendar in API responses, plus:
1. Add accent color to `lib/ThemeContext.tsx` or the component using it.
2. Update `CalendarCarousel.tsx` if rendering changes are needed.
3. Add translations for the new calendar's labels in all 6 locale files.

### 10.2 Backend Dependencies

The app depends entirely on `source.thequietframe.com` for:
- All content (planetary, cultural, wisdom, consciousness, media climate)
- Session management
- Billing status and purchase verification
- Interruption messages
- Dynamic wisdom cards
- The Cookie

If the backend is down:
- Content tabs show cached data or graceful fallbacks (curated artifacts).
- Billing uses grace period logic to prevent lockout (72h for fresh installs, 24h for existing subscribers).
- Interruption Layer uses cached message or skips.
- Cookie shows last cached version.

### 10.3 Store Configuration Checklist

**iOS (App Store Connect):**
1. Subscription Group: "Echoes Premium"
2. Products: monthly ($7.99) and yearly ($79.90)
3. Introductory Offer: Free Trial, 3 days, new subscribers only
4. Products status: "Ready to Submit" or approved
5. Sandbox testers added in Users and Access → Sandbox Testers
6. Bundle ID: `com.ignea.thequietframe`
7. IAP product SKUs use prefix `com.thequietframe.echoes` (not the bundle ID)

**Android (Google Play Console):**
1. Subscription products: monthly ($7.99) and yearly ($79.90)
2. Base plan with free trial offer: 3 days
3. Package name: `com.thequietframe.echoes` (matches IAP SKU prefix)
4. License testers added in Setup → License testing
5. Products must be active (not draft)

### 10.4 Backend Secrets (on source.thequietframe.com)

These secrets are configured on the backend server, not in the mobile app:

| Secret | Purpose |
|--------|---------|
| `APPLE_IAP_PRIVATE_KEY` | Apple App Store Server API private key |
| `APPLE_IAP_KEY_ID` | Apple API key ID |
| `APPLE_IAP_ISSUER_ID` | Apple API issuer ID |
| `APPLE_BUNDLE_ID` | iOS bundle identifier |
| `APPLE_ENV` | Apple environment (Sandbox / Production) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Play service account JSON |
| `GOOGLE_PACKAGE_NAME` | Android package name |

---

## 11. Troubleshooting

### 11.1 Diagnostics Panel

**Access:** Tap the version number in Settings 5 times.

**Shows:**
- Install ID
- Current entitlement status (full / free)
- Expiry date (if subscribed)
- IAP connection status (connected / disconnected)
- Manual reconnect button for StoreKit
- Console log output

### 11.2 Common Issues

#### Products show USD instead of local currency
**Cause:** StoreKit/Google Play not fully connected yet.
**Fix:** Wait a few seconds, or use the reconnect button in the diagnostics panel. The app retries with exponential backoff automatically.

#### iOS StoreKit sandbox gets "stuck"
**Cause:** StoreKit 2 sandbox can get into a bad state.
**Fix:** On the device: Settings → Developer → Reset Media Services, then restart the app.

#### Purchase succeeds but access not granted
**Cause:** Backend verification may have failed or been slow.
**Fix:** Use "Restore purchases" in Settings. The app will re-verify all transactions with the backend.

#### App shows "Free" after reinstall
**Cause:** Install ID may have changed (especially on iOS if Keychain was reset).
**Fix:** Use "Restore purchases" to re-link the subscription to the new Install ID.

#### Content not loading / showing stale data
**Cause:** API may be temporarily unreachable, or cache hasn't expired.
**Fix:**
1. Pull-to-refresh on the affected tab (if available).
2. Close and reopen the app (clears in-memory cache).
3. Check if `source.thequietframe.com` is accessible.

#### Interruption Layer not showing
**Cause:** API returned no message, or cached message is empty.
**Expected behavior:** The layer skips silently if no message is available.

#### Wrong dates for moveable feasts (Easter, Lunar New Year, etc.)
**Cause:** If the app has hardcoded fallback dates in `upcoming.tsx`, they may be outdated.
**Fix:** Ensure the API is reachable. The backend computes correct dates dynamically. Hardcoded fallbacks are only used when the API is unavailable.

### 11.3 IAP Testing Notes

- **iOS sandbox:** Subscription durations are shortened (1 month = 5 minutes, 1 year = 1 hour).
- **Android:** Test purchases use license tester accounts configured in Google Play Console.
- **Both platforms:** Require development builds (not Expo Go) for IAP to function.

### 11.4 Log Prefixes

When debugging, look for these log prefixes (visible in development builds only — stripped in production):

| Prefix | Module |
|--------|--------|
| `[ENTITLEMENT]` | Subscription status, verification, grace period |
| `[ENTITLEMENT:BOOT]` | Hook initialization |
| `[ENTITLEMENT:INIT]` | First-time setup |
| `[SESSION]` | Session token management |
| `[IAP]` | Store connection, product fetching, purchases |
| `[IAP:iOS]` | iOS-specific Install ID and store operations |
| `[CONTENT]` | Content fetching and proxy fallback |
| `[ACCESS_CACHE]` | Grace period cache |
| `[Cookie]` | Cookie caching |
| `[Interruption]` | Interruption Layer |
| `[AppState]` | App foregrounding / new day detection |

---

## 12. Enhancement Ideas

### Content & Features
- **Push notifications** for significant planetary events (optional, user-controlled).
- **Widgets** — iOS/Android home screen widgets showing daily snapshot (lunar phase, Cookie snippet).
- **Apple Watch** companion app showing simplified daily data.
- **Offline mode** — Pre-download daily bundle for areas with poor connectivity.
- **Shareable cards** — Let users share a beautifully formatted card (e.g., the Cookie) as an image.
- **Weekly/monthly digest** — Summary view of planetary patterns over time.
- **Personal calendar integration** — Overlay cultural dates onto the user's native calendar.

### Technical
- **Server-Sent Events (SSE)** for real-time consciousness data updates on Pulse tab.
- **Background fetch** — iOS background app refresh to pre-cache the daily bundle.
- **Analytics** — Privacy-respecting usage analytics (no personal data, aggregate patterns only).
- **A/B testing** for Paywall layouts via backend configuration.
- **Rate limiting** on API calls from the app to protect the backend.
- **Image caching** for Photo of the Day (currently fetches on each visit).
- **Deep linking** — Handle `echoes://` scheme for cross-app navigation (e.g., from Space app).

### Monetization
- **Gift subscriptions** — Allow users to purchase full access for others.
- **Promotional offers** — Backend-driven discount periods without app updates.
- **Family sharing** — Apple Family Sharing and Google Play Family Library support.

### Localization
- **Additional languages** — Arabic, Japanese, Korean, Hindi, Mandarin.
- **RTL support** — Right-to-left layout for Arabic and Hebrew UI.
- **Regional content** — Location-specific cultural content beyond calendar systems.

---

*This document is the single source of truth for the Echoes mobile app. Keep it updated as the app evolves.*

# Echoes - The Quiet Frame

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
- **In-App Purchase & Subscription:** Uses a "full access" subscription model (monthly/yearly) with `none`, `trial`, `paid`, and `expired` states. A dev access override is available for testing without real IAP.

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
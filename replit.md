# Echoes - The Quiet Frame

## Overview

Echoes is a cross-platform mobile application (iOS/Android) built with React Native and Expo that delivers cosmic wisdom and awareness aligned with planetary rhythms. The app provides personalized "echo cards" based on lunar phases, solar patterns, geomagnetic activity, global consciousness metrics, and cultural calendar systems. Users receive location-aware, time-sensitive content without requiring accounts or personal data collection.

The application operates on a principle of contextual relevance derived from astronomical data, geographic location, timezone, and language preferences—not user profiling. Content is generated through integration with The Quiet Frame (TQF) Planetary Awareness backend API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Mobile Application Framework

**Technology Stack:**
- React Native with Expo SDK for cross-platform mobile development
- Expo Router for file-based navigation and deep linking
- TypeScript for type safety across the codebase
- React Native Reanimated and Gesture Handler for smooth animations and swipeable card interactions

**Navigation Architecture:**
The app uses a tab-based navigation pattern with five main screens:
- **Today (/)** - Main feed showing daily echo cards and planetary context
- **Field (/field)** - Detailed planetary metrics and field analysis
- **Learn (/learn)** - Educational content about calendar systems and cultural observances
- **Upcoming (/upcoming)** - Future astronomical and cultural events
- **Settings (/settings)** - Location, theme, and timezone preferences

### State Management Pattern

**Context-Based Architecture:**
Two primary React contexts manage global application state:

1. **LocationContext** - Manages user location preferences (automatic GPS or manual entry), coordinates, timezone, and device language detection. Maps device locale to API-supported language codes (en, es, fr, pt, de, it, zh, ja, ar, hi, ru).

2. **ThemeContext** - Handles dark/light theme switching with comprehensive color systems for both modes. Provides theme colors throughout the component tree.

**Local-First Data Storage:**
- No user accounts or authentication
- All preferences stored locally using device storage
- Location mode: automatic (browser/device geolocation) or manual (city/coordinates)
- Selected calendars and language preferences cached locally

### Component Design Philosophy

**Modular Component Structure:**
- **EchoCard** - Swipeable cards with gesture animations, showing wisdom messages with share and info modals
- **MoonPhase** - SVG-based moon phase visualization with dynamic path generation
- **CalendarCarousel** - Grid display of multiple calendar systems (Gregorian, Mayan, Chinese, Hebrew, Islamic)
- **MetricsGrid** - Displays lunar, geomagnetic, and coherence metrics in a unified view
- **Hero, ContextChips, GlobalCoherence, MoodTemperature** - Contextual UI elements for planetary data presentation

**Animation Strategy:**
React Native Reanimated provides 60fps animations for card swiping, with spring physics for natural motion. Shared values and gesture detectors enable interactive card stacks.

### API Integration Architecture

**Backend Proxy Pattern:**
The application communicates with The Quiet Frame API through a backend proxy to protect API keys and enable server-side caching. Direct client-to-TQF communication is avoided for security.

**Primary Endpoints:**
- `/api/echoes/daily-bundle` - Single endpoint returning all daily data (echoes, planetary context, calendars, cultural observances)
- `/api/echoes/instant` - Quick planetary snapshot for real-time updates
- `/api/planetary/traditional-calendars` - Multi-calendar system data
- `/api/sacred-geography/living-calendars` - Seasonal and regional observances
- `/api/cultural/content/high-alignment` - Cultural artifacts and wisdom

**Data Fetching Strategy:**
- Cache-first approach with `expires_at` timestamps from API responses
- Instant snapshots cached for 10-15 minutes
- Daily bundles cached until expiration
- Pull-to-refresh pattern on main screens
- Fallback mock data for offline or API error scenarios

**Request Parameters:**
All API requests include: latitude, longitude, language code, timezone. The backend uses these for personalized content generation without user accounts.

### Theme System

**Dual Theme Architecture:**
Comprehensive color systems for both dark and light modes:
- Dark: Pure black background (#000000) with translucent white overlays
- Light: Neutral gray background (#F2F2F7) with white surfaces

**Dynamic Theme Detection:**
Automatically detects device color scheme preference but allows manual override. Theme colors propagate through Context to all styled components.

### Content Generation Logic

**Echo Card Types:**
Five categories of wisdom cards with distinct visual themes:
- Lunar guidance (moon-based insights)
- Solar rhythm (sun/light patterns)
- Global consciousness (collective coherence metrics)
- Cultural rhythms (calendar-based observances)
- Ancestral echo (traditional wisdom)

**Relevance Scoring:**
Backend API generates cards with relevance scores based on current astronomical conditions, user location, and temporal context.

## External Dependencies

### Primary External Services

**The Quiet Frame (TQF) Planetary Awareness API:**
- Base URL: `https://source.thequietframe.com`
- Authentication: API key via `x-api-key` header (server-side only)
- Provides planetary data, consciousness metrics, cultural calendar information, and AI-generated wisdom content
- Caching: Response includes `expires_at` timestamps for intelligent cache invalidation

**Expo Platform Services:**
- Expo Go for development/testing
- Expo Location for GPS and device location services
- Expo Localization for device language detection
- EAS (Expo Application Services) for production builds (iOS/Android)

### Third-Party Libraries

**UI & Animation:**
- `react-native-reanimated` (~3.16.0) - High-performance animations
- `react-native-gesture-handler` (~2.20.0) - Touch gesture handling
- `react-native-svg` (15.8.0) - SVG rendering for moon phases and icons
- `@react-navigation` - Navigation infrastructure (bottom tabs, native stack)

**Utility Libraries:**
- `lucide-react-native` - Icon system (used in settings, field details)
- `expo-haptics` - Tactile feedback for interactions
- `react-native-safe-area-context` - Safe area handling for iOS notch/dynamic island

**Development Tools:**
- TypeScript (~5.3.0) for type safety
- Babel with React Native preset
- Expo Metro bundler for development

### Database & Backend

**Note on Drizzle Configuration:**
The repository includes `drizzle.config.ts` with PostgreSQL dialect configuration pointing to `shared/schema.ts`. This suggests planned backend persistence layer, though the mobile app currently operates statelessly without a dedicated database. Future backend implementation may use:
- Drizzle ORM for type-safe database queries
- PostgreSQL (Neon serverless) for data storage
- Shared schema definitions between mobile and potential web client

**Current Backend Architecture:**
The mobile app relies entirely on The Quiet Frame external API. No local database or persistence layer is implemented beyond device-local preference storage.
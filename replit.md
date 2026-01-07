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

**PostgreSQL with Drizzle ORM:**
The app now uses PostgreSQL (Neon serverless) with Drizzle ORM for persistent storage of cultural observances data.

**Tables:**
- `cultural_observances` - Stores pre-calculated moveable holidays for accurate global event tracking
  - Fields: id, date, name, tradition, region, description, category
  - Contains 768 observances spanning 2026-2036 (11 years of pre-calculated moveable holidays)
  - Uses `date-holidays` library for automatic calculation of country-specific holidays
  - Verified moveable dates: Lunar New Year, Diwali, Holi, Ramadan, Eid al-Fitr, Passover, Vesak, Isra and Mi'raj, Easter, Orthodox Easter
  - Fixed dates: Orthodox Christmas, Vodoun Festival, Amazigh New Year, Republic Day (India), Australia Day, Waitangi Day, Nowruz, solstices, equinoxes, Celtic festivals
  - Library-sourced holidays from 20+ countries including: Japan (Foundation Day, Emperor's Birthday, Culture Day), Korea (Chuseok, Hangul Day), Thailand (Songkran, Makha Bucha, Loi Krathong), Israel (Tu BiShvat, Purim, Shavuot, Rosh Hashanah, Yom Kippur, Sukkot, Hanukkah), Ethiopia (Victory of Adwa, Meskel, Enkutatash, Timkat), South Africa (Human Rights Day, Freedom Day, Youth Day, Heritage Day), Mexico (Benito Juárez Day), Brazil (Tiradentes Day, Black Consciousness Day), Trinidad (Spiritual Baptist Liberation Day, Emancipation Day), Scandinavia (Midsummer, Santa Lucia, Sami National Day), and more

**Key Files:**
- `lib/db.ts` - Database connection using @neondatabase/serverless
- `shared/schema.ts` - Drizzle schema definitions
- `scripts/seed-observances.ts` - Seed script for generating 10 years of holiday data

**API Endpoints:**
- `/api/proxy/observances` - Query observances by date or date range
  - `?date=YYYY-MM-DD` - Single date query
  - `?start=YYYY-MM-DD&end=YYYY-MM-DD` - Date range query

## Recent Content Improvements (Session 12/04)

### New Utilities Created
- **labelize.ts** - Utility for consistent label/origin formatting, category humanization (snake_case → Title Case), and tone cleaning to remove directive coaching language

### New Services Created
- **ContentService.ts** - Unified wrapper for Sacred Geography, Oral Tradition, and Living Calendar API endpoints with:
  - 30-minute client-side caching with `expires_at` handling
  - Graceful fallbacks for empty/missing data
  - Language and location parameter forwarding

### Content Updates Applied
1. **Today Tab** - Added Living Tradition card with origin labels; echo cards use cleanTone() to remove directive language
2. **Upcoming Tab** - Merged Consciousness Calendar with planetary events; added diverse cultural dates (Samhain, Beltane, Diwali, Lunar New Year, solstices) with origin labels
3. **Field Tab** - Removed "How to read" coaching sections; replaced with "Context" interpretive text; removed accuracy percentages
4. **Learn Tab** - Added Explore section (Sacred Geography, Oral Tradition, Seasonal Rhythms) with origin labels and descriptive cards
5. **Seasonal Note Fix** - Enhanced Today tab Living Tradition card to always display content, falling back to mock data if API returns empty descriptions

### Content Strategy
- Removed directive coaching tone ("you should", vague authority claims) across all tabs
- Use source.thequietframe.com as canonical content source
- Include origin labels on all cultural/traditional content (Global · Seasonal, Indigenous Wisdom, etc.)
- Prioritize observational tone over prescriptive guidance

## Cookie Feature (Session 01/05)

### Overview
"The Cookie" is a daily fictional reflection prompt displayed on the Learn tab. Unlike other content which is data-driven from TQF sources, the Cookie is explicitly fictional content generated by AI for quiet contemplation.

### Implementation

**Server-Side (app/api/proxy/cookie+api.ts):**
- Uses OpenAI gpt-4o-mini via Replit AI Integrations (no API key needed, billed to credits)
- System prompt generates poetic, observational sentences (max 25 words)
- Never uses "you" or gives direct advice - purely reflective imagery
- Uses imagery of doors, shadows, mirrors, echoes, letters, clocks, rain, or silence
- Server-side daily caching (in-memory) to avoid redundant API calls

**Client-Side (lib/CookieService.ts):**
- Fetches cookie from /api/proxy/cookie endpoint
- Persists cookie in localStorage keyed by date
- Memory cache for same-session fast access
- Fallback to pre-written poetic sentences if API fails

**UI (app/learn.tsx):**
- "THE COOKIE" section with sparkles icon
- Clear fictional disclaimer: "This is fictional content generated for reflection, not guidance."
- Fortune cookie styling with centered italic text

### Example Cookie Output
- "A door left ajar lets in more than light."
- "The rain does not ask permission to fall."
- "Somewhere, a clock ticks in an empty room."
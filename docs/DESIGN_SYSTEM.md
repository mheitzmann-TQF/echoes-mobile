# Echoes - Design System

## Overview

Echoes uses a minimal, observational design language that positions users as witnesses rather than reactors. The visual design prioritizes calm, presence, and clarity over urgency or gamification.

## Color Palette

### Dark Theme (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#000000` | Primary background |
| `surface` | `rgba(255,255,255,0.05)` | Card backgrounds |
| `surfaceHighlight` | `rgba(255,255,255,0.1)` | Expanded/active states |
| `text` | `#FFFFFF` | Primary text |
| `textSecondary` | `rgba(255,255,255,0.6)` | Subtitles, labels |
| `textTertiary` | `rgba(255,255,255,0.4)` | Hints, timestamps |
| `border` | `rgba(255,255,255,0.1)` | Card borders, dividers |
| `accent` | `#4DB8FF` | Links, interactive elements |
| `accentSubtle` | `rgba(77, 184, 255, 0.15)` | Accent backgrounds |
| `error` | `#FF453A` | Error states |
| `success` | `#32D74B` | Success states |
| `overlay` | `rgba(0,0,0,0.85)` | Modal overlays |

### Light Theme

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#F2F2F7` | Primary background |
| `surface` | `#FFFFFF` | Card backgrounds |
| `surfaceHighlight` | `#E5E5EA` | Expanded/active states |
| `text` | `#000000` | Primary text |
| `textSecondary` | `rgba(0,0,0,0.6)` | Subtitles, labels |
| `textTertiary` | `rgba(0,0,0,0.4)` | Hints, timestamps |
| `border` | `rgba(0,0,0,0.1)` | Card borders, dividers |
| `accent` | `#007AFF` | Links, interactive elements |
| `accentSubtle` | `rgba(0, 122, 255, 0.1)` | Accent backgrounds |
| `error` | `#FF3B30` | Error states |
| `success` | `#34C759` | Success states |
| `overlay` | `rgba(0,0,0,0.85)` | Modal overlays |

### Semantic Accent Colors

Cards use left-border accent colors to indicate content type:

| Content Type | Color | Hex |
|--------------|-------|-----|
| Lunar/Moon | Purple | `#A78BFA` |
| Solar/Sun | Amber | `#F59E0B` |
| Geomagnetic | Teal | `#14B8A6` |
| Circadian | Emerald | `#34D399` |
| Dynamic/Space | Violet | `#8b5cf6` |
| Hebrew Calendar | Blue | `#60A5FA` |
| Mayan Calendar | Orange | `#FB923C` |
| Chinese Calendar | Red | `#F87171` |
| Hindu Calendar | Yellow | `#FBBF24` |
| Islamic Calendar | Green | `#4ADE80` |

## Typography

### Font Size Guidelines

Typography varies by context. These are common patterns, not strict rules:

| Element | Size Range | Weight Range |
|---------|------------|--------------|
| Screen Title | 34px | 700 (Bold) |
| Section Header | 20-22px | 600 (Semi-bold) |
| Card Title | 14-16px | 500-600 |
| Body Text | 14-15px | 400-500 |
| Labels/Captions | 10-12px | 500-600 |

Line heights are set contextually (typically 1.4-1.5x font size for body text).

### Text Alignment

- Card and screen content is **left-aligned**
- Exception: Interruption Layer message is centered (intentional for overlay context)
- Observational language only (no prescriptive or urgent phrasing)

## Spacing

### Base Units

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing, inline elements |
| sm | 8px | Icon gaps, small margins |
| md | 12px | Card internal padding, list gaps |
| lg | 16px | Section padding |
| xl | 20px | Screen padding |
| xxl | 24px | Section gaps |
| xxxl | 32px | Large section separators |

### Screen Layout

- Horizontal padding: 20px
- Bottom padding: 40px (for safe area)
- Card margin-bottom: 12px

## Components

### Cards

Standard cards use:
- Background: `surface` color
- Border: 1px `border` color
- Border radius: 16px
- Padding: 16px
- Optional left accent bar: 3px width

**Expandable Cards:**
- Collapsed: Show title + brief value
- Expanded: Full content + "Reading Notes" section
- Chevron icon indicates expandability

### Accent Bar Pattern

Cards with categorical content use a 3px left border accent:
```
borderLeftWidth: 3
borderLeftColor: {accentColor}
```

### Buttons

**Link Buttons:**
- Border: 1px with accent color
- Border radius: 8px
- Padding: 12px 16px
- Icon: External link (for outbound links)

### Loading States

- Skeleton cards with pulsing opacity animation (Wisdom tab)
- Activity indicator (spinner) for screen loads
- Splash screen shows centered logo on black background

### Interruption Layer

On app open, displays a brief observational message:
- Centered text (exception to left-align rule for overlay context)
- Font size: 18px
- Line height: 28px
- Max width: 320px
- Fade in → hold (4.2s) → fade out

## Animation Timing

| Animation | Duration |
|-----------|----------|
| Fade in | 500ms |
| Fade out | 600ms |
| Hold pause | 600ms |
| Message display | 4200ms |
| Layout animation | System default |

## Content Philosophy

### Language Rules

1. **Observe, don't prescribe** — "Energy often present" not "Good for tasks"
2. **No urgency** — No countdowns, alerts, or "act now" messaging
3. **No SaaS vocabulary** — "Full access" not "Premium/Pro/Upgrade"
4. **Left-aligned** — No centered body text
5. **No italics** in card content

### The Test

After viewing any tab, ask: "Do I need to do something now?"
- If answer is "no" and feeling is "I see" → the design succeeds

## Icon System

Uses `lucide-react-native` for consistent iconography:
- Size: 16-24px depending on context
- Color: Matches text hierarchy (text, textSecondary, textTertiary)
- Common icons: Moon, Sun, Globe, Zap, Clock, ChevronDown/Up, ExternalLink, Info

## Safe Areas

- Uses `react-native-safe-area-context` for device-safe padding
- All screens wrapped in `SafeAreaView`
- Bottom tab navigation accounts for home indicator

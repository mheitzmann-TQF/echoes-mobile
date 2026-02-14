# The Quiet Frame — Website Briefing

## Project Overview

Build a brand website for **The Quiet Frame (TQF)** — the platform behind the **Echoes** mobile app. The website serves dual purposes: a living expression of TQF's philosophy through dynamic content, and a showcase for the Echoes app with download links.

This is a **separate application** from the mobile app and its backend. It pulls live data from the existing TQF API at `source.thequietframe.com` and also manages its own blog/journal content.

---

## Brand Identity

### What is The Quiet Frame?

The Quiet Frame is a planetary awareness platform. It bridges global cultural wisdom with real-time planetary data — lunar phases, solar cycles, geomagnetic activity, consciousness metrics, and cultural calendar systems from around the world.

### Core Philosophy

> "Anchors may interpret, contextualize, relativize — but must NEVER prescribe."

- **Users are witnesses**, not reactors. The platform invites people to observe patterns in the world around them — planetary rhythms, cultural traditions, media currents — without telling them what to do about it.
- **The test:** After reading any content, ask "Do I need to do something now?" If the answer is "no" and the feeling is "I see" — the content succeeds.
- **Language is observational:** "Energy often present" not "Good for tasks." "Patterns emerging" not "Act now."

### What The Quiet Frame is NOT

- Not astrology (though it tracks celestial patterns)
- Not a wellness app (no self-improvement language)
- Not spiritual guidance (observational, not prescriptive)
- Not news analysis (it surfaces patterns, not opinions)

---

## Content Philosophy & Language Rules

### Voice

- Calm, observational, spacious
- Present tense preferred
- No urgency, no countdowns, no "act now" messaging
- No SaaS vocabulary: never use "premium," "pro," "upgrade," "unlock"
- Subscription language uses "full access" and "continue"
- No clickbait patterns, no manufactured excitement

### Tone Examples

| Instead of... | Use... |
|---------------|--------|
| "Unlock powerful insights" | "What's present today" |
| "Don't miss today's reading!" | "Today's patterns" |
| "Upgrade to Premium" | "Continue with full access" |
| "Breaking: Solar storm alert" | "Geomagnetic activity elevated" |
| "Optimize your day" | "Energy often observed" |
| "5 things you need to know" | "Five patterns present this week" |

---

## Visual Design System

### Overall Aesthetic

The design should feel like looking at the night sky — dark, spacious, alive, and contemplative. Calm without being lifeless. Rich without being loud.

### Color Palette — Dark Theme (Primary)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#000000` | Primary background |
| Surface | `rgba(255,255,255,0.05)` | Card backgrounds |
| Surface Highlight | `rgba(255,255,255,0.1)` | Hover/active states |
| Text | `#FFFFFF` | Primary text |
| Text Secondary | `rgba(255,255,255,0.6)` | Subtitles, labels |
| Text Tertiary | `rgba(255,255,255,0.4)` | Hints, timestamps |
| Border | `rgba(255,255,255,0.1)` | Card borders, dividers |
| Accent | `#4DB8FF` | Links, interactive elements |
| Accent Subtle | `rgba(77, 184, 255, 0.15)` | Accent backgrounds |
| Error | `#FF453A` | Error states |
| Success | `#32D74B` | Success states |

### Color Palette — Light Theme (Optional)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F2F2F7` | Primary background |
| Surface | `#FFFFFF` | Card backgrounds |
| Text | `#000000` | Primary text |
| Text Secondary | `rgba(0,0,0,0.6)` | Subtitles, labels |
| Accent | `#007AFF` | Links, interactive elements |

### Semantic Accent Colors (Content Categories)

| Content Type | Color | Hex |
|--------------|-------|-----|
| Lunar/Moon | Purple | `#A78BFA` |
| Solar/Sun | Amber | `#F59E0B` |
| Geomagnetic | Teal | `#14B8A6` |
| Circadian | Emerald | `#34D399` |
| Hebrew Calendar | Blue | `#60A5FA` |
| Mayan Calendar | Orange | `#FB923C` |
| Chinese Calendar | Red | `#F87171` |
| Hindu Calendar | Yellow | `#FBBF24` |
| Islamic Calendar | Green | `#4ADE80` |

### Typography

- Clean, modern sans-serif (Inter, system fonts)
- Generous line height (1.5-1.6x for body)
- Left-aligned text (no centered body text)
- No italics in content cards
- Size scale: Title 34px > Section Header 20-22px > Card Title 14-16px > Body 14-15px > Caption 10-12px

### Spacing

- Generous whitespace — let content breathe
- Card radius: 16px
- Card padding: 16px
- Section gaps: 24-32px
- Screen padding: 20px

### Cards

Cards are the primary content container:
- Background: surface color with 1px border
- Border radius: 16px
- Optional 3px left accent bar (color indicates content type)
- Expandable cards: collapsed shows title + brief value, expanded shows full content

### Animations

- Subtle, contemplative — nothing flashy
- Fade transitions: 500ms in, 600ms out
- Smooth scroll behavior
- No bounce, no shake, no attention-grabbing effects

---

## Website Structure

### Pages

1. **Home** (`/`)
   - Hero section with TQF philosophy statement
   - Live planetary snapshot (current lunar phase, solar activity, geomagnetic status from API)
   - Featured daily content (the Cookie, a wisdom snippet)
   - App download call-to-action (gentle, not pushy)
   - Brief "What is The Quiet Frame?" section

2. **Today** (`/today`)
   - Dynamic page pulling live data from source.thequietframe.com
   - Today's Cookie (AI-generated reflection prompt)
   - Current planetary readings (lunar, solar, geomagnetic)
   - Active cultural calendar dates (Hebrew, Mayan, Chinese, Hindu, Islamic)
   - Upcoming events/observances

3. **Philosophy** (`/philosophy`)
   - The Quiet Frame's approach explained
   - Content philosophy: observe, don't prescribe
   - How planetary awareness differs from astrology/prediction
   - The five calendar systems and why they matter

4. **Journal** (`/journal`)
   - Blog/article listing with published posts
   - Individual post view (`/journal/:slug`)
   - Written and published by Michel through an admin panel
   - Supports 6 languages (EN, ES, FR, DE, PT-BR, IT)

5. **Echoes App** (`/app` or `/echoes`)
   - App showcase with features overview
   - The five tabs explained (Today, Rhythms, Wisdom, Upcoming, Settings)
   - App screenshots (provided as assets)
   - Download links (App Store, Google Play)
   - Subscription info ("full access" language, not "premium")

6. **Legal** (`/terms`, `/privacy`)
   - Terms of service
   - Privacy policy
   - Required for App Store compliance

### Admin Panel

- Simple admin interface at `/admin` (password-protected)
- Create, edit, publish journal posts
- Rich text or markdown editor
- Multi-language support for posts
- Draft/published status

---

## Dynamic Content — API Integration

The website pulls live content from `source.thequietframe.com`. Key endpoints:

### Public Endpoints (no auth required)

```
GET /api/companion/daily-bundle?lat={lat}&lng={lng}&lang={lang}
```
Returns the complete daily bundle: lunar phase, solar data, geomagnetic activity, multi-calendar dates, consciousness metrics, the Cookie, upcoming events.

```
GET /api/wisdom/dynamic-cards?lang={lang}
```
Returns server-controlled wisdom cards (can be used to feature new content dynamically).

```
GET /api/cookie?lang={lang}
```
Returns the daily Cookie — an AI-generated fictional reflection prompt.

```
GET /api/companion/upcoming?lang={lang}&days=7
```
Returns upcoming cultural events and astronomical observances.

### Language Support

All API endpoints accept a `lang` parameter:
- `en` — English
- `es` — Spanish
- `fr` — French
- `de` — German
- `pt` — Portuguese (Brazilian)
- `it` — Italian

The website should detect browser language and default accordingly, with a manual language switcher.

---

## Technical Requirements

### Stack Suggestion
- React + TypeScript frontend
- Express/Node.js backend (for journal admin, API proxying)
- PostgreSQL database (for journal posts)
- Responsive design (mobile-first)

### Database — Journal Posts

```
journal_posts:
  id: serial primary key
  slug: varchar unique
  title: text (JSON for multi-language: { en: "...", es: "...", ... })
  content: text (JSON for multi-language)
  excerpt: text (JSON for multi-language)
  published: boolean default false
  publishedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
```

### SEO & Meta

- Open Graph tags for social sharing
- Twitter Card support
- Unique meta per page
- Structured data for articles (journal posts)

### Performance

- Server-side or static rendering for SEO-critical pages
- Cache API responses (planetary data changes slowly — cache for 5-15 minutes)
- Lazy load images
- Minimal JavaScript where possible

---

## App Store Assets

### Echoes App Info

- **App Name:** Echoes — The Quiet Frame
- **Bundle ID:** `com.thequietframe.echoes` (iOS)
- **Package Name:** `com.thequietframe.echoes` (Android)
- **App Store Link:** *(to be added when live)*
- **Google Play Link:** *(to be added when live)*

### Subscription Model

- Monthly: $7.99/month
- Yearly: $79.90/year (2 months free)
- Language: "Full access" — never "premium" or "pro"
- Preview period controlled by backend (currently 3 days)

---

## Content Samples

### The Cookie (Daily Reflection)
> "In a forest that remembers every footstep, a cartographer discovers that the most accurate maps are drawn by those who walk with their eyes closed."

*Subtitle: "A fact with a wink"*

### Planetary Snapshot
> **Lunar Phase:** Waning Gibbous (87% illuminated)
> **Solar Activity:** Moderate — 3 active regions
> **Geomagnetic:** Quiet (Kp 2)
> **Hebrew Calendar:** 15 Shevat 5786 — Tu BiShvat

### Observational Language Examples
> "The moon moves toward darkness. Energy often consolidates during this phase."
> "Geomagnetic activity is elevated. Some report increased sensitivity during these periods."
> "Three ancient calendars mark transition points this week."

---

## What Success Looks Like

A visitor arrives at thequietframe.com and feels:
- Calm, not stimulated
- Curious, not anxious
- Informed, not sold to
- Invited, not pushed

They see live planetary data, read a thought-provoking Cookie, browse a journal entry, learn about the Echoes app — and leave feeling like they witnessed something interesting rather than consumed a product.

The website breathes. It's alive with fresh data but never urgent. It's beautiful but never loud. It informs but never prescribes.

---

*Document version: February 2026*
*For: The Quiet Frame website (thequietframe.com)*
*Backend API: source.thequietframe.com*

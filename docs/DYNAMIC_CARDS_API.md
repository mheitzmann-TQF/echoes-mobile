# Dynamic Wisdom Cards API

## Overview

The World app (Echoes) supports dynamic wisdom cards that can be enabled or disabled from `source.thequietframe.com` without requiring an app update. This allows new features like "Space" to be introduced via server-side configuration.

## Endpoint

```
GET /api/wisdom/dynamic-cards?lang={lang}
```

### Parameters

| Parameter | Type   | Required | Description                     |
|-----------|--------|----------|---------------------------------|
| lang      | string | Yes      | Language code (en, es, fr, de, pt, it) |

## Response Schema

```json
{
  "success": true,
  "cards": [
    {
      "id": "space-intro",
      "enabled": true,
      "title": "The Space",
      "subtitle": "A different kind of conversation",
      "content": "Some experiences ask for presence beyond text. This one speaks.",
      "icon": "🌌",
      "accentColor": "#8b5cf6",
      "link": {
        "url": "https://space.thequietframe.com/enter",
        "label": "Enter the space"
      }
    }
  ]
}
```

### Card Fields

| Field       | Type   | Required | Description                                    |
|-------------|--------|----------|------------------------------------------------|
| id          | string | Yes      | Unique identifier for the card                 |
| enabled     | bool   | Yes      | When false, card does not appear in the app    |
| title       | string | Yes      | Main heading                                   |
| subtitle    | string | No       | Secondary text below title                     |
| content     | string | Yes      | Body text                                      |
| icon        | string | No       | Emoji displayed above title                    |
| accentColor | string | No       | Hex color for accent bar and link button       |
| link        | object | No       | Optional call-to-action                        |
| link.url    | string | Yes*     | URL to open (Universal Link recommended)       |
| link.label  | string | Yes*     | Button text                                    |

*Required when `link` object is present.

## App Behavior

1. **Fetch on load**: The Wisdom tab fetches `/api/wisdom/dynamic-cards` on each load
2. **Filter by enabled**: Only cards with `enabled: true` are displayed
3. **Graceful handling**: If the endpoint returns an error or is unavailable, no cards appear (no error shown to user)
4. **Fresh data**: Cards are fetched each time to allow immediate updates

## Universal Link Pattern

For app-to-app navigation (e.g., World → Space), a single canonical URL is used:

```
https://space.thequietframe.com/enter
```

This URL:
- Opens the Space app if installed (via iOS Universal Links / Android App Links)
- Redirects to the appropriate app store if not installed
- Optionally displays a minimal threshold page before the store

The World app calls `Linking.openURL(card.link.url)` — routing logic lives server-side.

## Localization

Cards are fetched with a `lang` parameter. The server returns localized content based on this parameter.

### Supported Languages
- `en` - English
- `es` - Spanish  
- `fr` - French
- `de` - German
- `pt` - Portuguese
- `it` - Italian

## Example: Hiding/Showing a Card

To hide a card from the app:
```json
{
  "id": "space-intro",
  "enabled": false,
  ...
}
```

Or omit it from the `cards` array.

To show it again:
```json
{
  "id": "space-intro", 
  "enabled": true,
  ...
}
```

The app reflects the change on next Wisdom tab load.

## Content Guidelines

Card content follows the app's observational framing philosophy — text contextualizes or describes without prescribing action. Example phrasing: "This space works with voice" rather than "You need to enable your microphone."

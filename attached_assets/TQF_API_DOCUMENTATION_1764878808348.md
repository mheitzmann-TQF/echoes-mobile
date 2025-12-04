# TQF Planetary Awareness API Documentation

**Base URL:** `https://source.thequietframe.com`

**Version:** 1.0.0  
**Last Updated:** December 2025

---

## Authentication

All API endpoints require authentication via the `x-api-key` header.

```
x-api-key: YOUR_TQF_MOBILE_API_KEY
```

### Security Best Practice

**Never embed API keys in mobile app code.** They can be extracted by anyone who decompiles your app.

**Recommended Architecture:**
```
Mobile App → Your Backend (validates user) → TQF API (with x-api-key)
```

Your backend acts as a secure proxy, keeping the API key server-side only.

---

## Quick Start

### Most Important Endpoint for Mobile Apps

**Daily Echo Bundle** - Returns everything your app needs in one call:

```
GET /api/echoes/daily-bundle?lat=40.7128&lng=-74.0060&lang=en&tz=America/New_York
```

**Response:**
```json
{
  "success": true,
  "generated_at": "2024-12-02T12:00:00.000Z",
  "expires_at": "2024-12-02T12:30:00.000Z",
  "cache_status": "hit",
  "response_time_ms": 45,
  "data": {
    "echo_cards": [
      {
        "id": "lunar_1701518400000_1",
        "type": "lunar_guidance",
        "title": "Waning Moon Wisdom",
        "message": "Time to release what no longer serves. The moon invites reflection.",
        "background_theme": "night_sky",
        "relevance_score": 92
      }
    ],
    "planetary_context": {
      "lunar": {
        "phase": "Waning Gibbous",
        "illumination": 78,
        "message": "A time for gratitude and gentle release"
      },
      "solar": {
        "phase": "Afternoon",
        "time_to_sunset": 14400,
        "message": "Peak creative energy available"
      },
      "consciousness_index": {
        "global_coherence": 72,
        "regional_resonance": 68,
        "trend": "rising"
      }
    },
    "location": {
      "timezone": "America/New_York",
      "local_time": "2024-12-02T12:00:00.000Z",
      "coordinates": { "lat": 40.7128, "lng": -74.006 }
    }
  }
}
```

---

## Endpoint Reference

### Planetary & Celestial Data

#### GET /api/echoes/instant
**Ultra-fast planetary snapshot** - Use for widgets and quick updates

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | Yes | Latitude (-90 to 90) |
| lng | number | Yes | Longitude (-180 to 180) |
| tz | string | No | Timezone (default: UTC) |

**Response:**
```json
{
  "success": true,
  "cache_status": "hit",
  "response_time_ms": 12,
  "data": {
    "lunar": {
      "phase": "Waning Gibbous",
      "illumination": 78
    },
    "solar": {
      "sunrise": "06:45",
      "sunset": "16:30",
      "current_phase": "Afternoon"
    },
    "geomagnetic": {
      "activity": "Quiet",
      "kp_index": 2
    },
    "seasonal": {
      "season": "Winter",
      "progress": 15
    }
  },
  "expires_at": "2024-12-02T12:15:00.000Z"
}
```

---

#### GET /api/echoes/daily-bundle
**Complete daily context bundle** - Recommended for main app screens

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | Yes | Latitude |
| lng | number | Yes | Longitude |
| lang | string | No | Language code (en, es, fr, zh, ar, hi, ru, etc.) |
| tz | string | No | Timezone |

Returns echo cards with AI-generated multilingual content plus full planetary context.

---

#### GET /api/planetary/current
**Live planetary data with location intelligence**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | No* | Latitude |
| lng | number | No* | Longitude |
| city | string | No* | City name |
| country | string | No* | Country name |

*Either coordinates (lat/lng) OR city/country required for solar data.

**Response:**
```json
{
  "lunar": {
    "phase": "Waning Gibbous",
    "illumination": 78,
    "age": 18.5,
    "distance": 384400,
    "phaseMessage": "Time for release and gratitude"
  },
  "solar": {
    "sunrise": "06:45:00",
    "sunset": "16:30:00",
    "solarNoon": "11:37:30",
    "dayLength": 35100,
    "currentPhase": "Afternoon Rising",
    "timeToSunset": 14400,
    "solarMessage": "Peak creative energy window"
  },
  "geomagnetic": {
    "activity": "Quiet",
    "kpIndex": 2,
    "description": "Optimal conditions for focus"
  },
  "seasonal": {
    "season": "Winter",
    "progress": 15,
    "daysToSolstice": 19,
    "hemisphere": "Northern"
  },
  "source": "live"
}
```

---

#### GET /api/planetary/events
**Upcoming astronomical events**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Max results (default: 10) |

**Response:**
```json
[
  {
    "id": "evt_123",
    "name": "Winter Solstice",
    "date": "2024-12-21",
    "type": "solstice",
    "description": "Shortest day of the year in Northern Hemisphere",
    "significance": "Major turning point - return of light"
  }
]
```

---

#### GET /api/planetary/traditional-calendars
**Traditional calendar systems worldwide** - Returns 5 living calendar traditions with spiritual context.

**Response:**
```json
[
  {
    "system": "Mayan Tzolkin",
    "date": "13 Eb",
    "significance": "Grass, service, dedication - contribute to the greater good",
    "energy": "Transformation - transcending limitations, cosmic alignment"
  },
  {
    "system": "Chinese Agricultural",
    "date": "Metal Snake - Month 12",
    "element": "Metal",
    "significance": "Metal energy brings Intuition, transformation, deep wisdom",
    "phase": "Winter Reflection - inner cultivation and rest"
  },
  {
    "system": "Hindu Panchang",
    "date": "Margashirsha - Trayodashi",
    "phase": "Krishna Paksha",
    "significance": "Preparation for culmination",
    "energy": "Building/Waning Energy"
  },
  {
    "system": "Islamic Hijri",
    "date": "14 Dhu al-Hijjah 1446",
    "phase": "Sacred journey culmination - unity with the divine",
    "significance": "Sacred month of pilgrimage and unity",
    "energy": "Sacred month energy - enhanced spiritual practices"
  },
  {
    "system": "Hebrew Calendar",
    "date": "14 Kislev 5786",
    "phase": "Waxing Moon - Building and Growth",
    "significance": "Month of dreams and light - miracles emerge from darkness",
    "energy": "Building energy - Spiritual momentum increasing"
  }
]
```

**Hebrew Calendar Field Details:**

| Field | Description |
|-------|-------------|
| `date` | Day, month name, and year (e.g., "14 Kislev 5786") |
| `phase` | Lunar phase or special day: "Shabbat", "Erev Shabbat", "Rosh Chodesh", "Waxing Moon", or "Waning Moon" |
| `significance` | Month meaning or detected holiday (Hanukkah, Passover, Rosh Hashanah, etc.) |
| `energy` | Current spiritual energy based on lunar cycle and month |

**Supported Hebrew Holidays:**
- **Tishrei:** Rosh Hashanah (1-2), Yom Kippur (10), Sukkot (15), Shemini Atzeret (22), Simchat Torah (23)
- **Kislev/Tevet:** Hanukkah (25 Kislev - 2 Tevet, 8 days)
- **Shevat:** Tu B'Shevat (15)
- **Adar:** Purim (14-15)
- **Nisan:** Passover (15-22)
- **Iyar:** Lag B'Omer (18), Yom HaAtzmaut (5)
- **Sivan:** Shavuot (6-7)
- **Av:** Tisha B'Av (9), Tu B'Av (15)

**Shabbat Detection:** Every Saturday returns `phase: "Shabbat - Day of Rest and Spiritual Renewal"`. Friday returns `phase: "Erev Shabbat - Preparation for Sacred Rest"`.

---

#### GET /api/planetary/biological-rhythms
**Current biological rhythm guidance**

**Response:**
```json
{
  "circadian": {
    "phase": "Peak Alertness",
    "description": "Optimal for complex mental tasks",
    "cortisol": "declining",
    "melatonin": "suppressed"
  },
  "ultradian": {
    "cycle": "Active",
    "minutesRemaining": 45,
    "suggestion": "Focus on priority tasks"
  },
  "recommendations": [
    "Best time for creative work",
    "Avoid heavy meals",
    "Good for learning new skills"
  ]
}
```

---

#### GET /api/planetary/optimal-timing
**Optimal timing suggestions**

**Response:**
```json
{
  "bestFor": {
    "meditation": "Early morning, pre-dawn",
    "creativeWork": "10:00-12:00",
    "physicalExercise": "16:00-18:00",
    "rest": "After sunset",
    "socializing": "Afternoon"
  },
  "avoid": {
    "majorDecisions": "After 22:00",
    "heavyMeals": "After 20:00"
  },
  "lunarInfluence": "Waning moon favors completion over initiation"
}
```

---

### Cultural & Consciousness Content

#### GET /api/cultural/content
**TQF-aligned global cultural insights**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Max results (default: 20) |
| offset | number | No | Pagination offset |

**Response:**
```json
[
  {
    "id": "content_123",
    "title": "Ubuntu Philosophy: I Am Because We Are",
    "summary": "Ancient African wisdom on interconnectedness...",
    "themes": ["community", "interconnection", "wisdom"],
    "tqfAlignment": 8.5,
    "region": "Africa",
    "source": {
      "name": "Cultural Wisdom Archive",
      "url": "https://example.com"
    },
    "publishedAt": "2024-12-01T10:00:00.000Z"
  }
]
```

---

#### GET /api/cultural/content/high-alignment
**High-scoring wisdom content only (7+/10 TQF alignment)**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| minAlignment | number | No | Minimum score (default: 70) |
| limit | number | No | Max results (default: 20) |

---

#### GET /api/consciousness
**Global consciousness coherence metrics**

**Response:**
```json
{
  "globalCoherence": 72,
  "filteredCoherence": 68,
  "trend24h": 3,
  "dominantThemes": ["transformation", "hope", "connection"],
  "regionalBreakdown": {
    "americas": 74,
    "europe": 70,
    "asia": 75,
    "africa": 71,
    "oceania": 69
  },
  "lastUpdated": "2024-12-02T11:00:00.000Z"
}
```

---

### Sacred Geography & Traditions

#### GET /api/sacred-geography/sites
**Sacred locations worldwide**

**Response:**
```json
[
  {
    "id": "site_123",
    "name": "Uluru",
    "location": {
      "lat": -25.3444,
      "lng": 131.0369,
      "country": "Australia"
    },
    "tradition": "Aboriginal Australian",
    "significance": "Sacred creation site, Dreamtime origin",
    "bestVisitTime": "Sunrise and sunset",
    "protocols": "Respect traditional owners' wishes"
  }
]
```

---

#### GET /api/sacred-geography/living-calendars
**Traditional calendar systems with current dates**

**Response:**
```json
[
  {
    "id": "cal_mayan",
    "name": "Mayan Tzolkin",
    "tradition": "Maya",
    "currentDate": "7 Manik",
    "meaning": "Day of healing and service",
    "guidance": "Focus on helping others today"
  }
]
```

---

#### GET /api/sacred-geography/ceremonial-timings
**Optimal times for rituals and ceremonies**

**Response:**
```json
[
  {
    "id": "timing_123",
    "ceremony": "Gratitude Practice",
    "tradition": "Universal",
    "optimalTimes": ["sunrise", "sunset"],
    "lunarPhase": "All phases, especially full moon",
    "currentRecommendation": "Tonight at sunset - strong lunar energy"
  }
]
```

---

#### GET /api/sacred-geography/oral-traditions
**Wisdom from oral cultures**

**Response:**
```json
[
  {
    "id": "oral_123",
    "tradition": "Aboriginal Australian",
    "category": "Seasonal Wisdom",
    "teaching": "When the wattle blooms, the fish are running",
    "application": "Observe natural signs for timing"
  }
]
```

---

#### GET /api/sacred-geography/weather-prophecies
**Traditional weather wisdom**

**Response:**
```json
[
  {
    "id": "weather_123",
    "tradition": "European Folk",
    "sign": "Red sky at night",
    "meaning": "Fair weather coming",
    "scientificBasis": "High pressure system approaching"
  }
]
```

---

#### GET /api/sacred-geography/plant-medicine-timing
**Optimal timing for plant/herbal work**

**Response:**
```json
[
  {
    "id": "plant_123",
    "plant": "Lavender",
    "activity": "Harvesting",
    "optimalTime": "Morning, after dew dries",
    "lunarPhase": "Waxing to full moon",
    "currentGuidance": "Good week for harvesting aerial parts"
  }
]
```

---

### Important Dates

#### GET /api/important-dates/upcoming
**Upcoming significant dates**

**Response:**
```json
[
  {
    "id": "date_123",
    "name": "Winter Solstice",
    "date": "2024-12-21",
    "type": "astronomical",
    "traditions": ["Celtic", "Nordic", "Chinese"],
    "significance": "Return of the light, rebirth symbolism",
    "daysUntil": 19
  }
]
```

---

#### GET /api/important-dates
**All important dates**

Same response format as above, includes past dates.

---

### Geocoding

#### POST /api/geocode
**Convert location names to coordinates**

**Request Body:**
```json
{
  "location": "Tokyo, Japan"
}
```

**Response:**
```json
{
  "success": true,
  "location": {
    "city": "Tokyo",
    "country": "Japan",
    "coordinates": {
      "lat": 35.6762,
      "lon": 139.6503,
      "timezone": "Asia/Tokyo"
    }
  }
}
```

---

### Utility Endpoints

#### GET /api/health
**Health check (no auth required)**

#### GET /api/debug/api-key-test
**Test API key validity**

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| MISSING_API_KEY | 401 | x-api-key header not provided |
| INVALID_API_KEY | 401 | API key not recognized |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests (1000/hour limit) |
| INVALID_COORDINATES | 400 | lat/lng values out of range |
| INTERNAL_ERROR | 500 | Server-side error |

---

## Rate Limits

- **1000 requests per hour** per API key
- Cached responses don't count against limit
- Use `cache_status` in responses to track cache hits

---

## Caching

Responses include cache headers:
- `expires_at`: When cached data expires
- `cache_status`: "hit" or "miss"

**Cache Durations:**
- Planetary data: 15 minutes
- Echo bundles: 30 minutes
- Cultural content: 1 hour
- Sacred geography: 24 hours

---

## Language Support

The `/api/echoes/daily-bundle` endpoint supports these languages via the `lang` parameter:

| Code | Language |
|------|----------|
| en | English |
| es | Spanish |
| fr | French |
| de | German |
| zh | Chinese |
| ar | Arabic |
| hi | Hindi |
| ru | Russian |
| pt | Portuguese |
| ja | Japanese |

AI-generated content adapts to cultural context of the language.

---

## Contact

For API key requests or technical support, contact the TQF team.

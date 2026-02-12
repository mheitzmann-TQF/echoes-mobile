/**
 * ContentService.ts - Centralized content fetching with caching
 * 
 * Wraps Source API endpoints with:
 * - 30-minute caching (or respects expires_at)
 * - Graceful fallbacks (no blank pages)
 * - Consistent error handling
 * - Direct-first fetching to source.thequietframe.com with proxy fallback
 */

import { labelize, cleanTone, formatOrigin, DisplayItem } from './labelize';
import { fetchContent, fetchContentJson, ContentEndpoints } from './api/contentClient';

// Cache configuration
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, { data: any; expiresAt: number }>();

// Fallback content for graceful degradation
const FALLBACK_LIVING_TRADITION = {
  id: 'fallback-tradition',
  title: 'Seasonal Wisdom',
  subtitle: 'The turning of seasons connects us to ancient rhythms observed across cultures.',
  origin: 'Traditional',
  category_label: 'Traditional',
  type: 'living_tradition',
};

const FALLBACK_CULTURAL_OFFERING = {
  id: 'fallback-cultural',
  title: 'Cultural Reflection',
  subtitle: 'A moment to pause and connect with the deeper currents of human experience.',
  origin: 'Universal',
  category_label: 'Reflective',
  type: 'cultural_offering',
};

// Curated cultural artifacts for fallback
const CURATED_ARTIFACTS = [
  {
    id: 'artifact-kintsugi',
    title: 'The Art of Kintsugi',
    subtitle: 'Japanese tradition of repairing broken pottery with gold, celebrating imperfection as beauty.',
    origin: 'Japanese',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-hygge',
    title: 'Hygge',
    subtitle: 'Danish concept of cozy contentment and well-being through simple pleasures.',
    origin: 'Nordic',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-ubuntu',
    title: 'Ubuntu Philosophy',
    subtitle: '"I am because we are" - the interconnectedness of humanity in Southern African thought.',
    origin: 'African',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-wabi-sabi',
    title: 'Wabi-Sabi',
    subtitle: 'Finding beauty in impermanence and incompleteness, a cornerstone of Japanese aesthetics.',
    origin: 'Japanese',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-ikigai',
    title: 'Ikigai',
    subtitle: 'The Japanese concept of a reason for being, the intersection of passion and purpose.',
    origin: 'Japanese',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-lagom',
    title: 'Lagom',
    subtitle: 'Swedish philosophy of "just enough" - balance and moderation in all things.',
    origin: 'Nordic',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-forest-bathing',
    title: 'Shinrin-yoku',
    subtitle: 'Japanese practice of forest bathing, connecting with nature for healing and clarity.',
    origin: 'Japanese',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
];

// Keywords that indicate news/political content (should be filtered out)
const NEWS_KEYWORDS = [
  'trump', 'biden', 'president', 'government', 'shutdown', 'congress',
  'election', 'vote', 'politics', 'politician', 'senate', 'house',
  'democrat', 'republican', 'party', 'breaking', 'update', 'news',
  'scandal', 'investigation', 'lawsuit', 'court', 'judge', 'ruling',
  'war', 'military', 'attack', 'strike', 'conflict', 'crisis',
  'stock', 'market', 'economy', 'inflation', 'recession', 'fed',
];

/**
 * Check if content appears to be news/political rather than cultural wisdom
 */
function isNewsContent(item: any): boolean {
  const textToCheck = [
    item.title || '',
    item.subtitle || '',
    item.description || '',
    item.message || '',
    item.content || '',
  ].join(' ').toLowerCase();
  
  return NEWS_KEYWORDS.some(keyword => textToCheck.includes(keyword));
}

/**
 * Get a curated artifact based on day rotation
 * Uses local date to ensure proper daily rotation regardless of timezone
 */
function getCuratedArtifact(): any {
  const now = new Date();
  // Use local date components to avoid timezone issues
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  
  // Create a simple day number: year * 366 + month * 31 + day
  // This ensures different days always get different indices
  const dayNumber = year * 366 + month * 31 + day;
  const index = dayNumber % CURATED_ARTIFACTS.length;
  return CURATED_ARTIFACTS[index];
}

const FALLBACK_CONSCIOUSNESS_EVENTS = [
  {
    id: 'winter-solstice',
    name: 'Winter Solstice',
    date: new Date(new Date().getFullYear(), 11, 21),
    category: 'natural',
    description: 'The shortest day, a threshold between darkness and returning light.',
    origin: 'Global',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    date: new Date(new Date().getFullYear(), 11, 25),
    category: 'religious',
    description: 'A celebration of light, generosity, and gathering.',
    origin: 'Christian',
  },
  {
    id: 'new-year',
    name: 'New Year',
    date: new Date(new Date().getFullYear() + 1, 0, 1),
    category: 'cultural',
    description: 'A fresh cycle begins, inviting reflection and intention.',
    origin: 'Global',
  },
  {
    id: 'lunar-new-year',
    name: 'Lunar New Year',
    date: new Date(new Date().getFullYear() + 1, 0, 29),
    category: 'cultural',
    description: 'Celebrated across East Asia, marking a new lunar cycle.',
    origin: 'East Asian',
  },
  {
    id: 'imbolc',
    name: 'Imbolc',
    date: new Date(new Date().getFullYear() + 1, 1, 1),
    category: 'pagan',
    description: 'Celtic festival marking the first stirrings of spring.',
    origin: 'Celtic',
  },
  {
    id: 'spring-equinox',
    name: 'Spring Equinox',
    date: new Date(new Date().getFullYear() + 1, 2, 20),
    category: 'natural',
    description: 'Day and night in balance, a threshold into the light half of the year.',
    origin: 'Global',
  },
];

/**
 * Get cached data or null if expired/missing
 */
function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return cached.data as T;
}

/**
 * Store data in cache with expiration
 */
function setCache(key: string, data: any, expiresAt?: string | number): void {
  let expiration: number;
  
  if (expiresAt) {
    expiration = typeof expiresAt === 'string' 
      ? new Date(expiresAt).getTime() 
      : expiresAt;
  } else {
    expiration = Date.now() + DEFAULT_CACHE_DURATION;
  }
  
  cache.set(key, { data, expiresAt: expiration });
}

/**
 * Fetch with timeout and error handling
 * Now uses direct-first pattern with proxy fallback
 */
async function fetchWithTimeout(endpoint: string, timeoutMs: number = 10000): Promise<Response> {
  return fetchContent(endpoint, { timeout: timeoutMs });
}

class ContentService {
  /**
   * Get the daily bundle (echo cards + planetary context)
   */
  async getTodayBundle(
    lat: number,
    lng: number,
    tz: string = 'UTC',
    lang: string = 'en'
  ): Promise<any> {
    const cacheKey = `today-bundle-${lat}-${lng}-${tz}-${lang}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const endpoint = ContentEndpoints.dailyBundle(lat, lng, lang, tz);
      const response = await fetchWithTimeout(endpoint);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.success && data.data) {
        if (data.data.echo_cards) {
          data.data.echo_cards = data.data.echo_cards.map((card: any) => ({
            ...card,
            message: cleanTone(card.message),
            title: card.title,
          }));
        }
        
        setCache(cacheKey, data, data.expires_at);
        return data;
      }
      
      throw new Error('Invalid response');
    } catch (error) {
      console.error('ContentService.getTodayBundle error:', error);
      return null;
    }
  }
  
  /**
   * Get consciousness calendar events (cultural/religious/natural observances)
   */
  async getConsciousnessCalendar(
    days: number = 90,
    lang: string = 'en'
  ): Promise<any[]> {
    const cacheKey = `consciousness-calendar-${days}-${lang}`;
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;
    
    try {
      const endpoint = ContentEndpoints.importantDates(lang, days);
      const response = await fetchWithTimeout(endpoint);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Map language code to field suffix (e.g., 'es' -> 'Es', 'fr' -> 'Fr')
        const langSuffix = lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
        
        // Labelize each event with translated name/description
        const labeled = data.map((item: any) => {
          // Get translated name (fallback to English 'name')
          const translatedName = item[`name${langSuffix}`] || item.name || item.title;
          // Get translated description (fallback to English 'description')
          const translatedDesc = item[`description${langSuffix}`] || item.description || item.summary || '';
          // Get translated cultural origin (fallback to English)
          const translatedOrigin = item[`culturalOrigin${langSuffix}`] || item.culturalOrigin || item.origin;
          
          return {
            ...item,
            name: translatedName,
            description: cleanTone(translatedDesc),
            origin: formatOrigin(translatedOrigin, item.tradition, item.region),
            category: item.category || item.type || 'cultural',
          };
        });
        
        setCache(cacheKey, labeled);
        return labeled;
      }
      
      // Return fallback if empty
      return FALLBACK_CONSCIOUSNESS_EVENTS;
    } catch (error) {
      console.error('ContentService.getConsciousnessCalendar error:', error);
      return FALLBACK_CONSCIOUSNESS_EVENTS;
    }
  }
  
  /**
   * Get sacred geography content for today
   */
  async getSacredGeographyToday(
    lat?: number,
    lng?: number,
    lang: string = 'en'
  ): Promise<DisplayItem[]> {
    const cacheKey = `sacred-geography-${lat}-${lng}-${lang}`;
    const cached = getFromCache<DisplayItem[]>(cacheKey);
    if (cached) return cached;
    
    try {
      const endpoint = ContentEndpoints.livingCalendars(lang);
      const response = await fetchWithTimeout(endpoint);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const labeled = data.map(labelize);
        setCache(cacheKey, labeled);
        return labeled;
      }
      
      return [labelize(FALLBACK_LIVING_TRADITION)];
    } catch (error) {
      console.error('ContentService.getSacredGeographyToday error:', error);
      return [labelize(FALLBACK_LIVING_TRADITION)];
    }
  }
  
  /**
   * Get living calendar wisdom for today
   */
  async getLivingCalendarToday(
    lat?: number,
    lng?: number,
    tz: string = 'UTC',
    lang: string = 'en'
  ): Promise<any> {
    const cacheKey = `living-calendar-${lat}-${lng}-${tz}-${lang}`;
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
    
    try {
      const endpoint = ContentEndpoints.traditionalCalendars(tz, lang, lat, lng);
      const response = await fetchWithTimeout(endpoint);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('ContentService.getLivingCalendarToday error:', error);
      return null;
    }
  }
  
  /**
   * Get oral tradition wisdom for today
   * Note: Uses living calendars endpoint as oral tradition may be embedded there
   */
  async getOralTraditionToday(
    lang: string = 'en'
  ): Promise<DisplayItem[]> {
    const cacheKey = `oral-tradition-${lang}`;
    const cached = getFromCache<DisplayItem[]>(cacheKey);
    if (cached) return cached;
    
    try {
      // Try sacred geography which often includes oral tradition
      const sacredGeo = await this.getSacredGeographyToday(undefined, undefined, lang);
      
      // Filter for oral tradition type items if available
      const oralTradition = sacredGeo.filter(
        (item) => item.type === 'oral_tradition' || item.category_label === 'Traditional'
      );
      
      if (oralTradition.length > 0) {
        setCache(cacheKey, oralTradition);
        return oralTradition;
      }
      
      // Return sacred geography as fallback
      return sacredGeo;
    } catch (error) {
      console.error('ContentService.getOralTraditionToday error:', error);
      return [labelize(FALLBACK_LIVING_TRADITION)];
    }
  }
  
  /**
   * Get cultural offering / artifact of the day
   * Filters out news/political content and falls back to curated artifacts
   */
  async getCulturalOffering(
    limit: number = 5,
    lang: string = 'en'
  ): Promise<DisplayItem | null> {
    const cacheKey = `cultural-offering-${lang}`;
    const cached = getFromCache<DisplayItem>(cacheKey);
    if (cached) return cached;
    
    try {
      const endpoint = ContentEndpoints.culturalContent(limit, lang);
      const response = await fetchWithTimeout(endpoint);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        // Filter out news/political content
        const culturalItems = data.filter((item: any) => !isNewsContent(item));
        
        if (culturalItems.length > 0) {
          const labeled = labelize(culturalItems[0]);
          // Clean the tone of the content
          if (labeled.subtitle) {
            labeled.subtitle = cleanTone(labeled.subtitle);
          }
          setCache(cacheKey, labeled);
          return labeled;
        }
        
        // All items were news - use curated artifact instead
        console.log('ContentService: API returned news content, using curated artifact');
      }
      
      // Return curated artifact (rotates daily)
      const curated = getCuratedArtifact();
      const labeled = labelize(curated);
      setCache(cacheKey, labeled);
      return labeled;
    } catch (error) {
      console.error('ContentService.getCulturalOffering error:', error);
      // Return curated artifact on error
      return labelize(getCuratedArtifact());
    }
  }
  
  /**
   * Get planetary events (astronomical)
   */
  async getPlanetaryEvents(
    limit: number = 50,
    lang: string = 'en'
  ): Promise<any[]> {
    const cacheKey = `planetary-events-${limit}-${lang}`;
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;
    
    try {
      const endpoint = ContentEndpoints.planetaryEvents(limit, lang);
      const response = await fetchWithTimeout(endpoint);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const labeled = data.map((item: any) => ({
          ...item,
          description: cleanTone(item.description || ''),
          category: 'astronomical',
          origin: formatOrigin(item.culturalOrigin || item.origin, item.tradition, item.region) || 'Astronomical',
        }));
        
        setCache(cacheKey, labeled);
        return labeled;
      }
      
      return [];
    } catch (error) {
      console.error('ContentService.getPlanetaryEvents error:', error);
      return [];
    }
  }
  
  /**
   * Get a random "Living Tradition" card for Today tab
   * Rotates through Sacred Geography, Oral Tradition, Living Calendar
   */
  async getLivingTraditionCard(
    lat?: number,
    lng?: number,
    lang: string = 'en'
  ): Promise<DisplayItem> {
    try {
      // Get all pools
      const [sacredGeo, oralTradition] = await Promise.all([
        this.getSacredGeographyToday(lat, lng, lang),
        this.getOralTraditionToday(lang),
      ]);
      
      // Combine unique items
      const allItems = [...sacredGeo, ...oralTradition];
      
      if (allItems.length === 0) {
        return labelize(FALLBACK_LIVING_TRADITION);
      }
      
      // Rotate based on day of year for consistency within a day
      const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      const index = dayOfYear % allItems.length;
      
      return allItems[index];
    } catch (error) {
      console.error('ContentService.getLivingTraditionCard error:', error);
      return labelize(FALLBACK_LIVING_TRADITION);
    }
  }
  
  /**
   * Get merged events for Upcoming tab
   * Combines planetary events + consciousness calendar
   */
  async getMergedUpcomingEvents(
    days: number = 90,
    lang: string = 'en'
  ): Promise<any[]> {
    try {
      const [planetary, consciousness] = await Promise.all([
        this.getPlanetaryEvents(50, lang),
        this.getConsciousnessCalendar(days, lang),
      ]);
      
      // Merge with proper category tagging
      const merged = [
        ...planetary.map((e) => ({ ...e, category: e.category || 'astronomical' })),
        ...consciousness.map((e) => ({ ...e, category: e.category || 'cultural' })),
      ];
      
      // Sort by date
      merged.sort((a, b) => {
        const dateA = new Date(a.date || a.timestamp || 0).getTime();
        const dateB = new Date(b.date || b.timestamp || 0).getTime();
        return dateA - dateB;
      });
      
      return merged;
    } catch (error) {
      console.error('ContentService.getMergedUpcomingEvents error:', error);
      return FALLBACK_CONSCIOUSNESS_EVENTS;
    }
  }
  
  /**
   * Clear all caches (for testing/refresh)
   */
  clearCache(): void {
    cache.clear();
  }
}

export const contentService = new ContentService();
export default contentService;

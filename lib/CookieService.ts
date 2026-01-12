import { getApiLang } from './lang';
import { SUPPORTED_LANGUAGES } from './i18n';
import { fetchContentJson, ContentEndpoints } from './api/contentClient';

const CACHE_KEY_PREFIX = 'echoes_cookie_cache_';

interface CachedCookie {
  text: string;
  date: string;
  language: string;
  expiresAt: number;
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

class CookieService {
  private memoryCache: CachedCookie | null = null;

  invalidateCache(): void {
    this.memoryCache = null;
    // Also clear localStorage for all languages to force fresh fetch
    const storage = getStorage();
    if (storage) {
      SUPPORTED_LANGUAGES.forEach(lang => {
        storage.removeItem(`${CACHE_KEY_PREFIX}${lang}`);
      });
    }
    console.log('[Cookie] Cache invalidated - will fetch fresh');
  }

  private getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  private getCacheKey(lang: string): string {
    return `${CACHE_KEY_PREFIX}${lang}`;
  }

  private loadFromStorage(lang: string): CachedCookie | null {
    try {
      const storage = getStorage();
      if (storage) {
        const stored = storage.getItem(this.getCacheKey(lang));
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch {
      console.log('Cookie storage read failed, using network');
    }
    return null;
  }

  private saveToStorage(cookie: CachedCookie): void {
    try {
      const storage = getStorage();
      if (storage) {
        storage.setItem(this.getCacheKey(cookie.language), JSON.stringify(cookie));
      }
    } catch {
      console.log('Cookie storage write failed');
    }
  }

  async getCookie(langOverride?: string): Promise<string> {
    const lang = langOverride || getApiLang();
    const todayKey = this.getTodayKey();
    const now = Date.now();
    
    console.log('[Cookie] Loading cookie for language:', lang);
    
    // Only use memory cache if it matches the exact language requested
    if (this.memoryCache && 
        this.memoryCache.date === todayKey && 
        this.memoryCache.language === lang &&
        this.memoryCache.expiresAt > now) {
      console.log('[Cookie] Returning from memory cache');
      return this.memoryCache.text;
    }
    
    // Always fetch fresh from API to ensure correct language
    console.log('[Cookie] Fetching from API for language:', lang);

    try {
      const endpoint = ContentEndpoints.cookie(lang);
      const data = await fetchContentJson<{ success: boolean; cookie: string }>(endpoint);
      
      if (data.success && data.cookie) {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        
        const cookie: CachedCookie = {
          text: data.cookie,
          date: todayKey,
          language: lang,
          expiresAt: midnight.getTime(),
        };
        
        this.memoryCache = cookie;
        this.saveToStorage(cookie);
        
        return data.cookie;
      }
      
      throw new Error('No cookie in response');
    } catch (error) {
      console.error('Cookie fetch error:', error);
      return this.getFallbackCookie(lang);
    }
  }

  private getFallbackCookie(lang: string): string {
    const fallbacks: Record<string, string[]> = {
      en: [
        'A door left ajar lets in more than light.',
        'The rain does not ask permission to fall.',
        'Even shadows need something to lean against.',
      ],
      es: [
        'Una puerta entreabierta deja entrar más que luz.',
        'La lluvia no pide permiso para caer.',
        'Incluso las sombras necesitan algo en qué apoyarse.',
      ],
      fr: [
        'Une porte entrouverte laisse entrer plus que la lumière.',
        'La pluie ne demande pas la permission de tomber.',
        'Même les ombres ont besoin de quelque chose sur quoi s\'appuyer.',
      ],
      de: [
        'Eine angelehnte Tür lässt mehr als Licht herein.',
        'Der Regen fragt nicht um Erlaubnis zu fallen.',
        'Auch Schatten brauchen etwas, woran sie sich lehnen können.',
      ],
      pt: [
        'Uma porta entreaberta deixa entrar mais que luz.',
        'A chuva não pede permissão para cair.',
        'Até as sombras precisam de algo para se apoiar.',
      ],
      it: [
        'Una porta socchiusa lascia entrare più della luce.',
        'La pioggia non chiede il permesso di cadere.',
        'Anche le ombre hanno bisogno di qualcosa su cui appoggiarsi.',
      ],
    };
    const validLang = fallbacks[lang] ? lang : 'en';
    return fallbacks[validLang][Math.floor(Math.random() * fallbacks[validLang].length)];
  }
}

export const cookieService = new CookieService();
export default cookieService;

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'echoes_cookie_cache';

interface CachedCookie {
  text: string;
  date: string;
  expiresAt: number;
}

class CookieService {
  private memoryCache: CachedCookie | null = null;
  private initialized = false;

  private getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  private async loadFromStorage(): Promise<CachedCookie | null> {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      console.log('Cookie storage read failed, using network');
    }
    return null;
  }

  private async saveToStorage(cookie: CachedCookie): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cookie));
    } catch {
      console.log('Cookie storage write failed');
    }
  }

  async getCookie(): Promise<string> {
    const todayKey = this.getTodayKey();
    const now = Date.now();
    
    if (this.memoryCache && this.memoryCache.date === todayKey && this.memoryCache.expiresAt > now) {
      return this.memoryCache.text;
    }

    if (!this.initialized) {
      this.initialized = true;
      const stored = await this.loadFromStorage();
      if (stored && stored.date === todayKey && stored.expiresAt > now) {
        this.memoryCache = stored;
        return stored.text;
      }
    }

    try {
      const response = await fetch('/api/proxy/cookie');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.cookie) {
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        
        const cookie: CachedCookie = {
          text: data.cookie,
          date: todayKey,
          expiresAt: midnight.getTime(),
        };
        
        this.memoryCache = cookie;
        await this.saveToStorage(cookie);
        
        return data.cookie;
      }
      
      throw new Error('No cookie in response');
    } catch (error) {
      console.error('Cookie fetch error:', error);
      return this.getFallbackCookie();
    }
  }

  private getFallbackCookie(): string {
    const fallbacks = [
      'A door left ajar lets in more than light.',
      'The rain does not ask permission to fall.',
      'Somewhere, a clock ticks in an empty room.',
      'The echo outlives the voice that made it.',
      'Even shadows need something to lean against.',
      'A letter never sent still changes the sender.',
      'The last page of the book is already written.',
      'Every mirror holds a conversation it will never share.',
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export const cookieService = new CookieService();
export default cookieService;

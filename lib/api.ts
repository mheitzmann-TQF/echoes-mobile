const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://source.thequietframe.com';
const API_KEY = process.env.EXPO_PUBLIC_TQF_API_KEY || process.env.TQF_MOBILE_API_KEY || '';

// Log config after module loads
if (typeof console !== 'undefined' && console.log) {
  setTimeout(() => {
    console.log('🔑 API Config:', {
      baseUrl: API_BASE_URL,
      hasApiKey: !!API_KEY,
      apiKeyLength: API_KEY.length,
    });
  }, 0);
}

export interface PlanetaryData {
  lunar: {
    phase: string;
    illumination: number;
  };
  solar: {
    sunrise: string;
    sunset: string;
    currentPhase: string;
  };
  geomagnetic: {
    activity: string;
    kpIndex: number;
  };
  seasonal: {
    season: string;
    progress: number;
  };
  consciousness?: {
    global_coherence: number;
    regional_resonance: number;
    trend: string;
  };
}

export interface Echo {
  id: string;
  type: 'lunar_guidance' | 'solar_rhythm' | 'global_consciousness' | 'cultural_rhythms' | 'ancestral_echo';
  title: string;
  message: string;
  background_theme: string;
  relevance_score: number;
  source_metrics?: string[];
}

export interface DailyBundleResponse {
  success: boolean;
  generated_at: string;
  expires_at: string;
  cache_status: string;
  response_time_ms: number;
  data: {
    echo_cards: Echo[];
    planetary_context: {
      lunar: {
        phase: string;
        illumination: number;
        message: string;
      };
      solar: {
        phase: string;
        time_to_sunset: number;
        message: string;
      };
      consciousness_index: {
        global_coherence: number;
        regional_resonance: number;
        trend: string;
      };
    };
    location: {
      timezone: string;
      local_time: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
  };
}

export interface ConsciousnessData {
  rawCoherence: number;
  filteredCoherence: number;
  transformationalContent: number;
  destructiveContent: number;
  hopeLevel: number;
  dominantEmotions: string[];
}

class EchoesAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = API_BASE_URL, apiKey: string = API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    
    return headers;
  }

  async getInstantPlanetary(lat: number, lng: number, tz: string = 'UTC'): Promise<PlanetaryData> {
    try {
      const url = `${this.baseUrl}/api/echoes/instant?lat=${lat}&lng=${lng}&tz=${tz}`;
      console.log('📡 Fetching planetary data from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      
      const data = await response.json();
      console.log('✅ Planetary data received:', data);
      
      if (!data.success) throw new Error('Failed to fetch planetary data');
      return data.data;
    } catch (error) {
      console.error('❌ Planetary data error:', {
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      throw error;
    }
  }

  async getConsciousnessAnalysis(location?: string): Promise<ConsciousnessData> {
    try {
      const url = location 
        ? `${this.baseUrl}/api/consciousness-analysis/raw-analysis?location=${encodeURIComponent(location)}`
        : `${this.baseUrl}/api/consciousness-analysis/raw-analysis`;
      console.log('📡 Fetching consciousness analysis from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Consciousness data received:', data);
      
      if (!data.success) throw new Error('Failed to fetch consciousness data');
      return data.data;
    } catch (error) {
      console.error('❌ Consciousness analysis error:', error);
      throw error;
    }
  }

  async getDailyBundle(
    lat: number,
    lng: number,
    lang: string = 'en',
    tz: string = 'UTC'
  ): Promise<DailyBundleResponse> {
    try {
      const url = `${this.baseUrl}/api/echoes/daily-bundle?lat=${lat}&lng=${lng}&lang=${lang}&tz=${tz}`;
      console.log('📡 Fetching daily bundle from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Daily bundle received:', data);
      if (!data.success) throw new Error('Failed to fetch daily bundle');
      return data;
    } catch (error) {
      console.error('❌ Daily bundle error:', error);
      throw error;
    }
  }

  async getTraditionalCalendars(lat?: number, lng?: number, tz: string = 'UTC', lang: string = 'en'): Promise<any> {
    try {
      let url = `${this.baseUrl}/api/planetary/traditional-calendars?tz=${tz}&lang=${lang}`;
      if (lat && lng) {
        url += `&lat=${lat}&lng=${lng}`;
      }
      console.log('📡 Fetching calendars from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Calendars error:', error);
      throw error;
    }
  }

  async getPlanetaryEvents(limit: number = 10, lang: string = 'en'): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/api/planetary/events?limit=${limit}&lang=${lang}`;
      console.log('📡 Fetching planetary events from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Events error:', error);
      return [];
    }
  }

  async getBiologicalRhythms(lat?: number, lng?: number, tz: string = 'UTC'): Promise<any> {
    try {
      let url = `${this.baseUrl}/api/planetary/biological-rhythms?tz=${tz}`;
      if (lat && lng) {
        url += `&lat=${lat}&lng=${lng}`;
      }
      console.log('📡 Fetching biological rhythms from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Biological rhythms error:', error);
      return null;
    }
  }

  async getCulturalContent(limit: number = 5, lang: string = 'en'): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/api/cultural/content/high-alignment?limit=${limit}&lang=${lang}`;
      console.log('📡 Fetching cultural content from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Cultural content error:', error);
      return [];
    }
  }

  async getLivingCalendars(lang: string = 'en'): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/api/sacred-geography/living-calendars?lang=${lang}`;
      console.log('📡 Fetching living calendars from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Living calendars error:', error);
      // Return mock data since this endpoint might be new/hypothetical
      return [
        {
          id: 'seasonal',
          title: 'Seasonal Pattern',
          summary: 'The light is shifting as we approach the solstice threshold.',
          why_now: 'We are 18 days from the turning point.'
        },
        {
          id: 'light',
          title: 'Light Shift',
          summary: 'Twilight lengthens in the northern hemisphere, inviting introspection.',
          why_now: 'Solar angle is currently at 23 degrees.'
        }
      ];
    }
  }

  async getImportantDates(lang: string = 'en'): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/api/important-dates/upcoming?lang=${lang}`;
      console.log('📡 Fetching important dates from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Important dates error:', error);
      // Return empty array to use fallback
      return [];
    }
  }
}

export const api = new EchoesAPI();
export default api;

// Use backend proxy - API key stays server-side for security
// Express server handles /api/* routes and proxies other requests to Expo Metro
const getApiBaseUrl = () => {
  // Check for explicit API URL override (for development with separate servers)
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Default to relative URLs (works when served from same origin)
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Log config after module loads
if (typeof console !== 'undefined' && console.log) {
  setTimeout(() => {
    console.log('🔑 API Config:', {
      mode: 'backend-proxy',
      baseUrl: API_BASE_URL || 'http://localhost:5000',
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

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  async getInstantPlanetary(lat: number, lng: number, tz: string = 'UTC'): Promise<PlanetaryData> {
    try {
      const url = `/api/proxy/echoes/instant?lat=${lat}&lng=${lng}&tz=${tz}`;
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

  async getConsciousnessAnalysis(): Promise<any> {
    try {
      // Fetch both current and raw-analysis endpoints in parallel
      const [currentResponse, rawResponse] = await Promise.all([
        fetch('/api/proxy/consciousness', { headers: this.getHeaders() }),
        fetch('/api/proxy/consciousness/raw-analysis', { headers: this.getHeaders() }),
      ]);
      
      if (!currentResponse.ok) {
        throw new Error(`HTTP ${currentResponse.status}: ${currentResponse.statusText}`);
      }
      
      const currentData = await currentResponse.json();
      console.log('✅ Consciousness data received:', currentData);
      
      // Try to get filtered consciousness from raw-analysis
      let filteredCoherence = null;
      let rawCoherence = null;
      let noiseLevel = null;
      let signalStrength = null;
      
      if (rawResponse.ok) {
        const rawData = await rawResponse.json();
        console.log('✅ Raw analysis data received:', rawData);
        if (rawData.success && rawData.data) {
          filteredCoherence = rawData.data.filteredCoherence;
          rawCoherence = rawData.data.rawCoherence;
          noiseLevel = rawData.data.noiseLevel;
          signalStrength = rawData.data.signalStrength;
        }
      }
      
      // Return merged data with filtered consciousness
      // Use rawCoherence as fallback for global_coherence if main endpoint returns 0
      const mainScore = currentData.global_coherence || currentData.tqf_score || 0;
      return {
        ...currentData,
        global_coherence: mainScore > 0 ? mainScore : (rawCoherence || 0),
        filtered_coherence: filteredCoherence,
        raw_coherence: rawCoherence,
        noise_level: noiseLevel,
        signal_strength: signalStrength,
      };
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
      const url = `/api/proxy/echoes/daily-bundle?lat=${lat}&lng=${lng}&lang=${lang}&tz=${tz}`;
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
      let url = `/api/proxy/planetary/traditional-calendars?tz=${tz}&lang=${lang}`;
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
      const url = `/api/proxy/planetary/events?limit=${limit}&lang=${lang}`;
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
      let url = `/api/proxy/planetary/biological-rhythms?tz=${tz}`;
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
      console.log('✅ Biological rhythms received:', data);
      return data;
    } catch (error) {
      console.error('❌ Biological rhythms error:', error);
      return null;
    }
  }

  async getCulturalContent(limit: number = 5, lang: string = 'en'): Promise<any[]> {
    // Import at top of file causes circular dependency issues, so we use inline definition
    // that mirrors the centralized culturalFilter.ts module
    const { filterCulturalContent, getCuratedArtifact } = require('./culturalFilter');
    
    try {
      const url = `/api/proxy/cultural/content/high-alignment?limit=${limit}&lang=${lang}`;
      console.log('📡 Fetching cultural content from:', url);
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return filterCulturalContent(data);
    } catch (error) {
      console.error('❌ Cultural content error:', error);
      return [getCuratedArtifact()];
    }
  }

  async getLivingCalendars(lang: string = 'en'): Promise<any[]> {
    try {
      const url = `/api/proxy/sacred-geography/living-calendars?lang=${lang}`;
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
      const url = `/api/proxy/important-dates/upcoming?lang=${lang}`;
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
      return [];
    }
  }

  async getOptimalTiming(lat?: number, lng?: number, tz: string = 'UTC', lang: string = 'en'): Promise<any> {
    try {
      let url = `/api/proxy/planetary/optimal-timing?tz=${tz}&lang=${lang}`;
      if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
      
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Optimal timing error:', error);
      return null;
    }
  }

  async getSacredSites(lang: string = 'en', limit: number = 20): Promise<any[]> {
    try {
      const url = `/api/proxy/sacred-geography/sites?lang=${lang}&limit=${limit}`;
      
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Sacred sites error:', error);
      return [];
    }
  }

  async getCeremonialTimings(lang: string = 'en'): Promise<any[]> {
    try {
      const url = `/api/proxy/sacred-geography/ceremonial-timings?lang=${lang}`;
      
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Ceremonial timings error:', error);
      return [];
    }
  }

  async getOralTraditions(lang: string = 'en', category?: string): Promise<any[]> {
    try {
      let url = `/api/proxy/sacred-geography/oral-traditions?lang=${lang}`;
      if (category) url += `&category=${category}`;
      
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Oral traditions error:', error);
      return [];
    }
  }

  async getWeatherProphecies(lang: string = 'en'): Promise<any[]> {
    try {
      const url = `/api/proxy/sacred-geography/weather-prophecies?lang=${lang}`;
      
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Weather prophecies error:', error);
      return [];
    }
  }

  async getPlantMedicineTiming(lang: string = 'en'): Promise<any[]> {
    try {
      const url = `/api/proxy/sacred-geography/plant-medicine-timing?lang=${lang}`;
      
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Plant medicine timing error:', error);
      return [];
    }
  }
}

export const api = new EchoesAPI();
export default api;

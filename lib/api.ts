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
}

export interface Echo {
  id: string;
  type: 'lunar_guidance' | 'solar_rhythm' | 'global_consciousness' | 'cultural_rhythms' | 'ancestral_echo';
  title: string;
  message: string;
  background_theme: string;
  relevance_score: number;
}

export interface StreamResponse {
  success: boolean;
  echoes: Echo[];
  metadata: {
    companionId: string;
    timestamp: string;
    responseTime: string;
    lunar_phase: string;
    time_of_day: string;
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
  private timeout = 5000; // 5 second timeout

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

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getInstantPlanetary(lat: number, lng: number, tz: string = 'UTC'): Promise<PlanetaryData> {
    try {
      const url = `${this.baseUrl}/api/echoes/instant?lat=${lat}&lng=${lng}&tz=${tz}`;
      console.log('📡 Fetching planetary data from:', url);
      
      const response = await this.fetchWithTimeout(url, {
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

  async getDailyEchoes(
    companionId: string,
    lat: number,
    lng: number,
    localHour: number = new Date().getHours(),
    language: string = 'en'
  ): Promise<StreamResponse> {
    try {
      const url = `${this.baseUrl}/api/companion-simple/stream`;
      console.log('📡 Fetching daily echoes from:', url);
      
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          companionId,
          userLocation: { lat, lng },
          localHour,
          language
        })
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      
      const data = await response.json();
      console.log('✅ Daily echoes received:', data);
      return data;
    } catch (error) {
      console.error('❌ Daily echoes error:', {
        message: error instanceof Error ? error.message : String(error),
        error,
      });
      throw error;
    }
  }

  async getConsciousnessAnalysis(): Promise<ConsciousnessData> {
    try {
      const url = `${this.baseUrl}/api/consciousness-analysis/raw-analysis`;
      console.log('📡 Fetching consciousness analysis from:', url);
      
      const response = await this.fetchWithTimeout(url, {
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
  ): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/echoes/daily-bundle?lat=${lat}&lng=${lng}&lang=${lang}&tz=${tz}`;
      console.log('📡 Fetching daily bundle from:', url);
      
      const response = await this.fetchWithTimeout(url, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Daily bundle received:', data);
      return data;
    } catch (error) {
      console.error('❌ Daily bundle error:', error);
      throw error;
    }
  }
}

export const api = new EchoesAPI();
export default api;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://tqf-planetary-awareness.replit.app';

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

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getInstantPlanetary(lat: number, lng: number, tz: string = 'UTC'): Promise<PlanetaryData> {
    const response = await fetch(
      `${this.baseUrl}/api/echoes/instant?lat=${lat}&lng=${lng}&tz=${tz}`
    );
    const data = await response.json();
    if (!data.success) throw new Error('Failed to fetch planetary data');
    return data.data;
  }

  async getDailyEchoes(
    companionId: string,
    lat: number,
    lng: number,
    localHour: number = new Date().getHours(),
    language: string = 'en'
  ): Promise<StreamResponse> {
    const response = await fetch(`${this.baseUrl}/api/companion-simple/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companionId,
        userLocation: { lat, lng },
        localHour,
        language
      })
    });
    return response.json();
  }

  async getConsciousnessAnalysis(): Promise<ConsciousnessData> {
    const response = await fetch(`${this.baseUrl}/api/consciousness-analysis/raw-analysis`);
    const data = await response.json();
    if (!data.success) throw new Error('Failed to fetch consciousness data');
    return data.data;
  }

  async getDailyBundle(
    lat: number,
    lng: number,
    lang: string = 'en',
    tz: string = 'UTC'
  ): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/api/echoes/daily-bundle?lat=${lat}&lng=${lng}&lang=${lang}&tz=${tz}`
    );
    return response.json();
  }
}

export const api = new EchoesAPI();
export default api;

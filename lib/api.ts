import { fetchContent, fetchContentJson, ContentEndpoints } from './api/contentClient';

if (typeof console !== 'undefined' && console.log) {
  setTimeout(() => {
    console.log('🔑 API Config:', {
      mode: 'direct-first-with-proxy-fallback',
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

export interface RegionalBreakdown {
  region: string;
  regionDisplay: string;
  articleCount: number;
  percentOfTotal: number;
  avgAlignment: number;
  filteredAlignment: number;
  breakdown: {
    transformational: number;
    neutral: number;
    misaligned: number;
  };
}

export interface RegionalBreakdownResponse {
  success: boolean;
  data: {
    totalArticles: number;
    regionCount: number;
    regions: RegionalBreakdown[];
    dataWindow: string;
    lastUpdated: string;
  };
}

class EchoesAPI {
  async getInstantPlanetary(lat: number, lng: number, tz: string = 'UTC'): Promise<PlanetaryData> {
    try {
      const endpoint = ContentEndpoints.instant(lat, lng, tz);
      console.log('📡 Fetching planetary data...');
      
      const data = await fetchContentJson(endpoint);
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
      const [currentResponse, rawResponse] = await Promise.all([
        fetchContent(ContentEndpoints.consciousness()),
        fetchContent(ContentEndpoints.consciousnessRawAnalysis()),
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
      let transformationalContent = null;
      let destructiveContent = null;
      let articlesAnalyzed = null;
      let contentSources: string[] = [];
      let rawTrend7d = null;
      
      if (rawResponse.ok) {
        const rawData = await rawResponse.json();
        console.log('✅ Raw analysis data received:', rawData);
        if (rawData.success && rawData.data) {
          filteredCoherence = rawData.data.filteredCoherence;
          rawCoherence = rawData.data.rawCoherence;
          noiseLevel = rawData.data.noiseLevel;
          signalStrength = rawData.data.signalStrength;
          transformationalContent = rawData.data.transformationalContent;
          destructiveContent = rawData.data.destructiveContent;
          articlesAnalyzed = rawData.data.scoredArticles;
          contentSources = rawData.data.metadata?.contentSources || [];
          rawTrend7d = rawData.data.trend7d;
        }
      }
      
      // Return merged data with filtered consciousness
      // Use rawCoherence as fallback for global_coherence if main endpoint returns 0
      const mainScore = currentData.global_coherence || currentData.tqf_score || 0;
      // Use raw-analysis values as fallback for percentages if main returns 0
      const mainTransformational = currentData.transformational_percent;
      const mainDestructive = currentData.destructive_percent;
      const mainArticles = currentData.articles_analyzed;
      
      // Use raw-analysis trend if main endpoint returns suspicious data (0 articles = bad data)
      const mainTrend = currentData.trend_7d;
      const useTrend = mainArticles > 0 ? mainTrend : (rawTrend7d !== null ? `+${rawTrend7d}` : mainTrend);
      
      return {
        ...currentData,
        global_coherence: mainScore > 0 ? mainScore : (rawCoherence || 0),
        filtered_coherence: filteredCoherence,
        raw_coherence: rawCoherence,
        noise_level: noiseLevel,
        signal_strength: signalStrength,
        transformational_percent: mainTransformational > 0 ? mainTransformational : (transformationalContent ?? 0),
        destructive_percent: mainDestructive > 0 ? mainDestructive : (destructiveContent ?? 0),
        articles_analyzed: mainArticles > 0 ? mainArticles : (articlesAnalyzed ?? 0),
        content_sources: contentSources,
        trend_7d: useTrend,
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
      const endpoint = ContentEndpoints.dailyBundle(lat, lng, lang, tz);
      console.log('📡 Fetching daily bundle...');
      
      const data = await fetchContentJson(endpoint);
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
      const endpoint = ContentEndpoints.traditionalCalendars(tz, lang, lat, lng);
      console.log('📡 Fetching calendars...');
      
      const data = await fetchContentJson(endpoint);
      return data;
    } catch (error) {
      console.error('❌ Calendars error:', error);
      throw error;
    }
  }

  async getPlanetaryEvents(limit: number = 10, lang: string = 'en'): Promise<any[]> {
    try {
      const endpoint = ContentEndpoints.planetaryEvents(limit, lang);
      console.log('📡 Fetching planetary events...');
      
      const data = await fetchContentJson(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Events error:', error);
      return [];
    }
  }

  async getBiologicalRhythms(lat?: number, lng?: number, tz: string = 'UTC'): Promise<any> {
    try {
      const endpoint = ContentEndpoints.biologicalRhythms(tz, lat, lng);
      console.log('📡 Fetching biological rhythms...');
      
      const data = await fetchContentJson(endpoint);
      console.log('✅ Biological rhythms received:', data);
      return data;
    } catch (error) {
      console.error('❌ Biological rhythms error:', error);
      return null;
    }
  }

  async getCulturalContent(limit: number = 5, lang: string = 'en'): Promise<any[]> {
    const { filterCulturalContent, getCuratedArtifact } = require('./culturalFilter');
    
    try {
      const endpoint = ContentEndpoints.culturalContent(limit, lang);
      console.log('📡 Fetching cultural content...');
      
      const data = await fetchContentJson(endpoint);
      return filterCulturalContent(data);
    } catch (error) {
      console.error('❌ Cultural content error:', error);
      return [getCuratedArtifact()];
    }
  }

  async getLivingCalendars(lang: string = 'en'): Promise<any[]> {
    try {
      const endpoint = ContentEndpoints.livingCalendars(lang);
      console.log('📡 Fetching living calendars...');
      
      const data = await fetchContentJson(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Living calendars error:', error);
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
      const endpoint = ContentEndpoints.importantDates(lang);
      console.log('📡 Fetching important dates...');
      
      const data = await fetchContentJson(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Important dates error:', error);
      return [];
    }
  }

  async getOptimalTiming(lat?: number, lng?: number, tz: string = 'UTC', lang: string = 'en'): Promise<any> {
    try {
      const endpoint = ContentEndpoints.optimalTiming(tz, lang, lat, lng);
      const data = await fetchContentJson(endpoint);
      return data;
    } catch (error) {
      console.log('Optimal timing fetch skipped');
      return null;
    }
  }

  async getSacredSites(lang: string = 'en', limit: number = 20): Promise<any[]> {
    try {
      const endpoint = ContentEndpoints.sacredSites(lang, limit);
      const data = await fetchContentJson(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Sacred sites error:', error);
      return [];
    }
  }

  async getCeremonialTimings(lang: string = 'en'): Promise<any[]> {
    try {
      const endpoint = ContentEndpoints.ceremonialTimings(lang);
      const data = await fetchContentJson(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Ceremonial timings error:', error);
      return [];
    }
  }

  async getOralTraditions(lang: string = 'en', category?: string): Promise<any[]> {
    try {
      const endpoint = ContentEndpoints.oralTraditions(lang, category);
      const data = await fetchContentJson(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Oral traditions error:', error);
      return [];
    }
  }

  async getWeatherProphecies(lang: string = 'en'): Promise<any[]> {
    try {
      const endpoint = ContentEndpoints.weatherProphecies(lang);
      const data = await fetchContentJson(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Weather prophecies error:', error);
      return [];
    }
  }

  async getPlantMedicineTiming(lang: string = 'en'): Promise<any[]> {
    try {
      const endpoint = ContentEndpoints.plantMedicineTiming(lang);
      const data = await fetchContentJson(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Plant medicine timing error:', error);
      return [];
    }
  }

  async getRegionalBreakdown(): Promise<RegionalBreakdownResponse | null> {
    try {
      const endpoint = ContentEndpoints.consciousnessRegionalBreakdown();
      const data = await fetchContentJson(endpoint);
      console.log('✅ Regional breakdown received:', data);
      return data;
    } catch (error) {
      console.error('❌ Regional breakdown error:', error);
      return null;
    }
  }

  async getWisdomCycle(lang: string = 'en', date?: string): Promise<AncientWisdomResponse | null> {
    try {
      const endpoint = ContentEndpoints.wisdomCycle(lang, date);
      const data = await fetchContentJson<AncientWisdomResponse>(endpoint);
      console.log('✅ Ancient wisdom received:', data);
      return data;
    } catch (error) {
      console.error('❌ Ancient wisdom error:', error);
      return null;
    }
  }
}

export interface AncientWisdomCulture {
  name: string;
  culture: 'mayan' | 'yoruba' | 'chinese' | 'ethiopian' | 'celtic' | 'hindu' | 'egyptian';
  icon: string;
  message: string;
  daySign?: string;
  tone?: number;
  toneName?: string;
  dayName?: string;
  deity?: string;
  element?: string;
  tree?: string;
  month?: string;
  decan?: string;
  tithi?: string;
}

export interface AncientWisdomResponse {
  date: string;
  cultures: AncientWisdomCulture[];
}

export const api = new EchoesAPI();
export default api;

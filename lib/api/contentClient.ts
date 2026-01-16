import Constants from 'expo-constants';

const SOURCE_BASE_URL = 'https://source.thequietframe.com';

function useDirectSource(): boolean {
  const expoConfig = Constants.expoConfig || Constants.manifest;
  const extra = (expoConfig as any)?.extra;
  return extra?.useSourceDirect !== false;
}

function getProxyBaseUrl(): string {
  const expoConfig = Constants.expoConfig || Constants.manifest;
  const extra = (expoConfig as any)?.extra;
  return extra?.apiUrl || '';
}

const SOURCE_TO_PROXY_PATH_MAP: Record<string, string> = {
  '/api/consciousness/current': '/api/proxy/consciousness',
  '/api/consciousness-analysis/raw-analysis': '/api/proxy/consciousness/raw-analysis',
  '/api/consciousness-analysis/regional-breakdown': '/api/proxy/consciousness/regional-breakdown',
};

function mapToProxyEndpoint(endpoint: string): string {
  for (const [sourcePattern, proxyPath] of Object.entries(SOURCE_TO_PROXY_PATH_MAP)) {
    if (endpoint.startsWith(sourcePattern)) {
      return endpoint.replace(sourcePattern, proxyPath);
    }
  }
  return endpoint.startsWith('/api/') 
    ? endpoint.replace('/api/', '/api/proxy/')
    : `/api/proxy${endpoint}`;
}

interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

export async function fetchContent(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 10000, headers = {} } = options;
  const directEnabled = useDirectSource();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const fetchOptions = {
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  
  try {
    if (directEnabled) {
      const directUrl = `${SOURCE_BASE_URL}${endpoint}`;
      console.log('[CONTENT] Fetching direct:', directUrl);
      
      const response = await fetch(directUrl, fetchOptions);
      
      if (response.ok) {
        clearTimeout(timeoutId);
        return response;
      }
      
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        console.log('[CONTENT] Direct failed, falling back to proxy:', response.status);
      } else {
        clearTimeout(timeoutId);
        return response;
      }
    }
    
    const proxyBase = getProxyBaseUrl();
    const proxyEndpoint = mapToProxyEndpoint(endpoint);
    const proxyUrl = `${proxyBase}${proxyEndpoint}`;
    
    console.log('[CONTENT] Fetching via proxy:', proxyUrl);
    const response = await fetch(proxyUrl, fetchOptions);
    clearTimeout(timeoutId);
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (directEnabled) {
      console.log('[CONTENT] Direct fetch failed, trying proxy as fallback');
      
      const proxyBase = getProxyBaseUrl();
      const proxyEndpoint = mapToProxyEndpoint(endpoint);
      const proxyUrl = `${proxyBase}${proxyEndpoint}`;
      
      const fallbackController = new AbortController();
      const fallbackTimeout = setTimeout(() => fallbackController.abort(), timeout);
      
      try {
        const response = await fetch(proxyUrl, {
          ...fetchOptions,
          signal: fallbackController.signal,
        });
        clearTimeout(fallbackTimeout);
        return response;
      } catch (fallbackError) {
        clearTimeout(fallbackTimeout);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

export async function fetchContentJson<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchContent(endpoint, options);
  
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  
  return response.json();
}

export const ContentEndpoints = {
  dailyBundle: (lat: number, lng: number, lang: string, tz: string) =>
    `/api/echoes/daily-bundle?lat=${lat}&lng=${lng}&lang=${lang}&tz=${tz}`,
  
  instant: (lat: number, lng: number, tz: string) =>
    `/api/echoes/instant?lat=${lat}&lng=${lng}&tz=${tz}`,
  
  traditionalCalendars: (tz: string, lang: string, lat?: number, lng?: number) => {
    let url = `/api/planetary/traditional-calendars?tz=${tz}&lang=${lang}`;
    if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
    return url;
  },
  
  biologicalRhythms: (tz: string, lat?: number, lng?: number) => {
    let url = `/api/planetary/biological-rhythms?tz=${tz}`;
    if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
    return url;
  },
  
  planetaryEvents: (limit: number, lang: string) =>
    `/api/planetary/events?limit=${limit}&lang=${lang}`,
  
  optimalTiming: (tz: string, lang: string, lat?: number, lng?: number) => {
    let url = `/api/planetary/optimal-timing?tz=${tz}&lang=${lang}`;
    if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
    return url;
  },
  
  consciousness: () => `/api/consciousness/current`,
  
  consciousnessRawAnalysis: () => `/api/consciousness-analysis/raw-analysis`,
  
  consciousnessRegionalBreakdown: () => `/api/consciousness-analysis/regional-breakdown`,
  
  importantDates: (lang: string, days?: number) => {
    let url = `/api/important-dates/upcoming?lang=${lang}`;
    if (days) url += `&days=${days}`;
    return url;
  },
  
  livingCalendars: (lang: string) => `/api/sacred-geography/living-calendars?lang=${lang}`,
  
  culturalContent: (limit: number, lang: string) =>
    `/api/cultural/content/high-alignment?limit=${limit}&lang=${lang}`,
  
  cookie: (lang: string) => `/api/cookie?lang=${lang}`,
  
  sacredSites: (lang: string, limit: number) =>
    `/api/sacred-geography/sites?lang=${lang}&limit=${limit}`,
  
  ceremonialTimings: (lang: string) => `/api/sacred-geography/ceremonial-timings?lang=${lang}`,
  
  oralTraditions: (lang: string, category?: string) => {
    let url = `/api/sacred-geography/oral-traditions?lang=${lang}`;
    if (category) url += `&category=${category}`;
    return url;
  },
  
  weatherProphecies: (lang: string) => `/api/sacred-geography/weather-prophecies?lang=${lang}`,
  
  plantMedicineTiming: (lang: string) => `/api/sacred-geography/plant-medicine-timing?lang=${lang}`,
  
  wisdomCycle: (lang: string, date?: string) => {
    let url = `/api/wisdom/cycle?lang=${lang}`;
    if (date) url += `&date=${date}`;
    return url;
  },
  
  wisdomAll: (lang: string) => `/api/wisdom/all?lang=${lang}`,
};

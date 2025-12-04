import { ExpoRequest, ExpoResponse } from 'expo-router/server';

const TQF_API_KEY = process.env.TQF_MOBILE_API_KEY || '';
const TQF_BASE_URL = 'https://source.thequietframe.com';

export async function GET(request: ExpoRequest) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '5';
    const lang = url.searchParams.get('lang') || 'en';
    
    const response = await fetch(
      `${TQF_BASE_URL}/api/cultural/content/high-alignment?limit=${limit}&lang=${lang}`,
      {
        headers: { 'x-api-key': TQF_API_KEY },
      }
    );
    
    const data = await response.json();
    return ExpoResponse.json(data);
  } catch (error) {
    return ExpoResponse.json({ error: 'Failed to fetch cultural content' }, { status: 500 });
  }
}

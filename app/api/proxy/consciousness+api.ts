import { ExpoRequest, ExpoResponse } from 'expo-router/server';

const TQF_API_KEY = process.env.TQF_MOBILE_API_KEY || '';
const TQF_BASE_URL = 'https://source.thequietframe.com';

export async function GET() {
  try {
    const response = await fetch(
      `${TQF_BASE_URL}/api/consciousness/current`,
      {
        headers: { 'x-api-key': TQF_API_KEY },
      }
    );
    
    const data = await response.json();
    return ExpoResponse.json(data);
  } catch (error) {
    return ExpoResponse.json({ error: 'Failed to fetch consciousness data' }, { status: 500 });
  }
}

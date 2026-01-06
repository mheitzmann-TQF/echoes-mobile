import { TQF_API_KEY } from "@/lib/env";


const TQF_API_KEY = process.env.TQF_MOBILE_API_KEY || '';
const TQF_BASE_URL = 'https://source.thequietframe.com';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || '10';
    const lang = url.searchParams.get('lang') || 'en';
    
    const response = await fetch(
      `${TQF_BASE_URL}/api/planetary/events?limit=${limit}&lang=${lang}`,
      {
        headers: { 'x-api-key': TQF_API_KEY },
      }
    );
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

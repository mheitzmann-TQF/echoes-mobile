import { TQF_API_KEY, API_URL } from "@/lib/env";


const TQF_BASE_URL = API_URL;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const tz = url.searchParams.get('tz') || 'UTC';
    
    const response = await fetch(
      `${TQF_BASE_URL}/api/echoes/instant?lat=${lat}&lng=${lng}&tz=${tz}`,
      {
        headers: { 'x-api-key': TQF_API_KEY },
      }
    );
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch planetary data' }, { status: 500 });
  }
}

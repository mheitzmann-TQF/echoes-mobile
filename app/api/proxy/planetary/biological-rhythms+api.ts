

const TQF_API_KEY = process.env.TQF_MOBILE_API_KEY || '';
const TQF_BASE_URL = 'https://source.thequietframe.com';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const tz = url.searchParams.get('tz') || 'UTC';
    
    let apiUrl = `${TQF_BASE_URL}/api/planetary/biological-rhythms?tz=${tz}`;
    if (lat && lng) {
      apiUrl += `&lat=${lat}&lng=${lng}`;
    }
    
    const response = await fetch(apiUrl, {
      headers: { 'x-api-key': TQF_API_KEY },
    });
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch biological rhythms' }, { status: 500 });
  }
}

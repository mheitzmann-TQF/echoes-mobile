const SOURCE_URL = 'https://source.thequietframe.com';

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || 'en';
    
    const response = await fetch(`${SOURCE_URL}/api/cookie?lang=${lang}`);
    
    if (!response.ok) {
      throw new Error(`Upstream error ${response.status}`);
    }
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Cookie proxy error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch cookie' },
      { status: 500 }
    );
  }
}

import { TQF_API_KEY, API_URL } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const tz = url.searchParams.get("tz") ?? "UTC";
    const lang = url.searchParams.get("lang") ?? "en";

    let apiUrl = `${API_URL}/api/planetary/optimal-timing?tz=${tz}&lang=${lang}`;

    if (lat && lng) {
      apiUrl += `&lat=${lat}&lng=${lng}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        "x-api-key": TQF_API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 204) {
        return Response.json({ activities: [], recommendations: [] });
      }
      throw new Error(`Upstream error ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ activities: [], recommendations: [] });
  }
}

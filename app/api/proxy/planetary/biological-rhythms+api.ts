import { TQF_API_KEY, API_URL } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const tz = url.searchParams.get("tz") ?? "UTC";

    let apiUrl = `${API_URL}/api/planetary/biological-rhythms?tz=${tz}`;

    if (lat && lng) {
      apiUrl += `&lat=${lat}&lng=${lng}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        "x-api-key": TQF_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream error ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch biological rhythms" },
      { status: 500 }
    );
  }
}
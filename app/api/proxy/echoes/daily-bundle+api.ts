import { TQF_API_KEY, API_URL } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const lang = url.searchParams.get("lang") || "en";
    const tz = url.searchParams.get("tz") || "UTC";

    const response = await fetch(
      `${API_URL}/api/echoes/daily-bundle?lat=${lat}&lng=${lng}&lang=${lang}&tz=${tz}`,
      {
        headers: { "x-api-key": TQF_API_KEY },
      }
    );

    if (!response.ok) {
      throw new Error(`Upstream error ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch daily bundle" },
      { status: 500 }
    );
  }
}
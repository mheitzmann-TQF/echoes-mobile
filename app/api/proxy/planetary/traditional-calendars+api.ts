import { TQF_API_KEY, API_URL } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const lang = url.searchParams.get("lang") ?? "en";
    const tz = url.searchParams.get("tz") ?? "UTC";

    let apiUrl = `${API_URL}/api/planetary/traditional-calendars?tz=${tz}&lang=${lang}`;

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
    return Response.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Vary": "Accept-Language",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch calendars" },
      { status: 500 }
    );
  }
}
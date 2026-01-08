import { TQF_API_KEY, API_URL } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") || "5";
    const lang = url.searchParams.get("lang") || "en";

    const response = await fetch(
      `${API_URL}/api/cultural/content/high-alignment?limit=${limit}&lang=${lang}`,
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
      { error: "Failed to fetch cultural content" },
      { status: 500 }
    );
  }
}
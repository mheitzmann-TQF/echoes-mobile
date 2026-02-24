import { TQF_API_KEY, API_URL } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang");
    let apiUrl = `${API_URL}/api/consciousness-analysis/raw-analysis?period=daily`;
    if (lang) apiUrl += `&lang=${lang}`;

    const response = await fetch(apiUrl, {
      headers: {
        "x-api-key": TQF_API_KEY,
      },
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch raw consciousness analysis" },
      { status: 500 }
    );
  }
}

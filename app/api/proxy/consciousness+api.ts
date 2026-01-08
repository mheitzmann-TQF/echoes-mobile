import { TQF_API_KEY, API_URL } from "@/lib/env";

export async function GET() {
  try {
    const response = await fetch(
      `${API_URL}/api/consciousness/current`,
      {
        headers: {
          "x-api-key": TQF_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Upstream error ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch consciousness data" },
      { status: 500 }
    );
  }
}
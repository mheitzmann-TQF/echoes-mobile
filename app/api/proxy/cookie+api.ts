// app/api/proxy/cookie+api.ts
import OpenAI from "openai";
import { OPENAI_API_KEY, OPENAI_BASE_URL } from "@/lib/env";

let dailyCache: { cookie: string; date: string } | null = null;

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

const SYSTEM_PROMPT = `You are a mysterious fortune cookie writer for The Quiet Frame, a contemplative app about cosmic rhythms. Generate ONE short, evocative sentence (maximum 25 words) that:

- Sounds like a poetic observation or riddle, not advice
- Uses imagery of doors, shadows, mirrors, echoes, letters, clocks, rain, or silence
- Feels slightly mysterious but not dark
- Never uses "you" or gives direct instructions
- Reads like a fragment of a larger truth

Generate only the sentence, no quotes or explanation.`;

function getFallbackCookie() {
  const pool = [
    "A door left ajar lets in more than light.",
    "Somewhere, a clock ticks in an empty room.",
    "The echo outlives the voice that made it.",
    "Rain writes briefly on the window, then forgets.",
    "A mirror remembers what the mind misplaces.",
    "Silence keeps time when words break.",
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function GET(): Promise<Response> {
  try {
    const todayKey = getTodayKey();

    if (dailyCache && dailyCache.date === todayKey) {
      return Response.json({ success: true, cookie: dailyCache.cookie, cached: true });
    }

    // If OpenAI isn’t configured locally, never crash the route.
    if (!OPENAI_API_KEY) {
      const cookie = getFallbackCookie();
      dailyCache = { cookie, date: todayKey };
      return Response.json({ success: true, cookie, cached: false, fallback: true, reason: "missing_openai_key" });
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: OPENAI_BASE_URL || undefined,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Generate today's cookie." },
      ],
      max_tokens: 60,
      temperature: 0.9,
    });

    const cookie =
      completion.choices[0]?.message?.content?.trim() ||
      "The echo outlives the voice that made it.";

    dailyCache = { cookie, date: todayKey };

    return Response.json({ success: true, cookie, cached: false });
  } catch (error) {
    console.error("Cookie generation error:", error);
    const cookie = getFallbackCookie();
    return Response.json({ success: true, cookie, cached: false, fallback: true });
  }
}
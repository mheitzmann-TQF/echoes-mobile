// app/api/proxy/cookie+api.ts
import OpenAI from "openai";
import { OPENAI_API_KEY, OPENAI_BASE_URL } from "@/lib/env";

const dailyCache: Record<string, { cookie: string; date: string }> = {};

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
};

function getSystemPrompt(lang: string): string {
  const langName = LANGUAGE_NAMES[lang] || 'English';
  return `You are a mysterious fortune cookie writer for The Quiet Frame, a contemplative app about cosmic rhythms. Generate ONE short, evocative sentence (maximum 25 words) IN ${langName.toUpperCase()} that:

- Sounds like a poetic observation or riddle, not advice
- Uses imagery of doors, shadows, mirrors, echoes, letters, clocks, rain, or silence
- Feels slightly mysterious but not dark
- Never uses "you" or gives direct instructions
- Reads like a fragment of a larger truth

IMPORTANT: Write the sentence in ${langName}. Generate only the sentence, no quotes or explanation.`;
}

const FALLBACK_COOKIES: Record<string, string[]> = {
  en: [
    "A door left ajar lets in more than light.",
    "Somewhere, a clock ticks in an empty room.",
    "The echo outlives the voice that made it.",
    "Rain writes briefly on the window, then forgets.",
  ],
  es: [
    "Una puerta entreabierta deja pasar más que luz.",
    "En algún lugar, un reloj marca el tiempo en una habitación vacía.",
    "El eco sobrevive a la voz que lo creó.",
    "La lluvia escribe brevemente en la ventana, luego olvida.",
  ],
  fr: [
    "Une porte entrouverte laisse entrer plus que la lumière.",
    "Quelque part, une horloge bat dans une pièce vide.",
    "L'écho survit à la voix qui l'a créé.",
    "La pluie écrit brièvement sur la fenêtre, puis oublie.",
  ],
  de: [
    "Eine angelehnte Tür lässt mehr als Licht herein.",
    "Irgendwo tickt eine Uhr in einem leeren Raum.",
    "Das Echo überlebt die Stimme, die es erschuf.",
    "Der Regen schreibt kurz ans Fenster, dann vergisst er.",
  ],
  pt: [
    "Uma porta entreaberta deixa entrar mais do que luz.",
    "Em algum lugar, um relógio marca o tempo numa sala vazia.",
    "O eco sobrevive à voz que o criou.",
    "A chuva escreve brevemente na janela, depois esquece.",
  ],
  it: [
    "Una porta socchiusa lascia entrare più della luce.",
    "Da qualche parte, un orologio ticchetta in una stanza vuota.",
    "L'eco sopravvive alla voce che l'ha creato.",
    "La pioggia scrive brevemente sulla finestra, poi dimentica.",
  ],
};

function getFallbackCookie(lang: string): string {
  const pool = FALLBACK_COOKIES[lang] || FALLBACK_COOKIES.en;
  return pool[Math.floor(Math.random() * pool.length)];
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || 'en';
    const validLang = LANGUAGE_NAMES[lang] ? lang : 'en';
    
    const todayKey = getTodayKey();
    const cacheKey = `${todayKey}_${validLang}`;

    if (dailyCache[cacheKey]) {
      return Response.json({ success: true, cookie: dailyCache[cacheKey].cookie, cached: true });
    }

    if (!OPENAI_API_KEY) {
      const cookie = getFallbackCookie(validLang);
      dailyCache[cacheKey] = { cookie, date: todayKey };
      return Response.json({ success: true, cookie, cached: false, fallback: true, reason: "missing_openai_key" });
    }

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: OPENAI_BASE_URL || undefined,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: getSystemPrompt(validLang) },
        { role: "user", content: `Generate today's cookie in ${LANGUAGE_NAMES[validLang]}.` },
      ],
      max_tokens: 80,
      temperature: 0.9,
    });

    const cookie =
      completion.choices[0]?.message?.content?.trim() ||
      getFallbackCookie(validLang);

    dailyCache[cacheKey] = { cookie, date: todayKey };

    return Response.json({ success: true, cookie, cached: false });
  } catch (error) {
    console.error("Cookie generation error:", error);
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') || 'en';
    const cookie = getFallbackCookie(lang);
    return Response.json({ success: true, cookie, cached: false, fallback: true });
  }
}

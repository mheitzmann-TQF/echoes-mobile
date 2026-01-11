import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { db } from "../lib/db";
import { dailyCookies } from "../shared/schema";
import { eq, and } from "drizzle-orm";
import { seedMultipleYears } from "../lib/seedJewishHolidays";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const TQF_API_KEY = process.env.TQF_MOBILE_API_KEY || "";
const TQF_BASE_URL = "https://source.thequietframe.com";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Disable ETag globally to prevent 304 responses for language-dependent content
  app.disable('etag');
  // User Settings Routes
  app.get("/api/user/:userId/settings", async (req, res) => {
    try {
      const settings = await storage.getUserSettings(req.params.userId);
      res.json(settings || { language: "en", theme: "dark" });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/user/:userId/settings", async (req, res) => {
    try {
      const settings = await storage.updateUserSettings(req.params.userId, req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });

  // TQF API Proxy Routes - secure API key server-side
  app.get("/api/proxy/echoes/instant", async (req, res) => {
    try {
      const { lat, lng, tz } = req.query;
      const response = await fetch(
        `${TQF_BASE_URL}/api/echoes/instant?lat=${lat}&lng=${lng}&tz=${tz || "UTC"}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch planetary data" });
    }
  });

  app.get("/api/proxy/echoes/daily-bundle", async (req, res) => {
    try {
      const { lat, lng, lang, tz } = req.query;
      const response = await fetch(
        `${TQF_BASE_URL}/api/echoes/daily-bundle?lat=${lat}&lng=${lng}&lang=${lang || "en"}&tz=${tz || "UTC"}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily bundle" });
    }
  });

  app.get("/api/proxy/planetary/traditional-calendars", async (req, res) => {
    try {
      const { lat, lng, lang, tz } = req.query;
      let url = `${TQF_BASE_URL}/api/planetary/traditional-calendars?tz=${tz || "UTC"}&lang=${lang || "en"}`;
      if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
      const response = await fetch(url, {
        headers: { "x-api-key": TQF_API_KEY },
        cache: 'no-store',
      });
      const data = await response.json();
      res.set("Cache-Control", "no-store, no-cache, must-revalidate");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      res.set("Vary", "Accept-Language");
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendars" });
    }
  });

  app.get("/api/proxy/planetary/biological-rhythms", async (req, res) => {
    try {
      const { lat, lng, tz } = req.query;
      let url = `${TQF_BASE_URL}/api/planetary/biological-rhythms?tz=${tz || "UTC"}`;
      if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
      const response = await fetch(url, {
        headers: { "x-api-key": TQF_API_KEY },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch biological rhythms" });
    }
  });

  app.get("/api/proxy/planetary/events", async (req, res) => {
    try {
      const { limit, lang } = req.query;
      const response = await fetch(
        `${TQF_BASE_URL}/api/planetary/events?limit=${limit || 10}&lang=${lang || "en"}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/proxy/cultural/content/high-alignment", async (req, res) => {
    try {
      const { limit, lang } = req.query;
      const response = await fetch(
        `${TQF_BASE_URL}/api/cultural/content/high-alignment?limit=${limit || 5}&lang=${lang || "en"}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cultural content" });
    }
  });

  app.get("/api/proxy/sacred-geography/living-calendars", async (req, res) => {
    try {
      const { lang } = req.query;
      const cacheBust = `${lang || "en"}-${Date.now()}`;
      const response = await fetch(
        `${TQF_BASE_URL}/api/sacred-geography/living-calendars?lang=${lang || "en"}&_cb=${cacheBust}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
          cache: "no-store",
        }
      );
      const data = await response.json();
      res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      res.set('Vary', 'Accept-Language');
      res.removeHeader('ETag');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch living calendars" });
    }
  });

  app.get("/api/proxy/consciousness", async (req, res) => {
    try {
      const response = await fetch(
        `${TQF_BASE_URL}/api/consciousness/current`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consciousness data" });
    }
  });

  // Raw consciousness analysis with filtered consciousness data
  app.get("/api/proxy/consciousness/raw-analysis", async (req, res) => {
    try {
      const response = await fetch(
        `${TQF_BASE_URL}/api/consciousness-analysis/raw-analysis`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch raw consciousness analysis" });
    }
  });

  // Regional consciousness breakdown by geographic region
  app.get("/api/proxy/consciousness/regional-breakdown", async (req, res) => {
    try {
      const response = await fetch(
        `${TQF_BASE_URL}/api/consciousness-analysis/regional-breakdown`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch regional breakdown" });
    }
  });

  app.get("/api/proxy/important-dates/upcoming", async (req, res) => {
    try {
      const { lang } = req.query;
      const response = await fetch(
        `${TQF_BASE_URL}/api/important-dates/upcoming?lang=${lang || "en"}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch important dates" });
    }
  });

  app.get("/api/proxy/planetary/optimal-timing", async (req, res) => {
    try {
      const { lat, lng, tz, lang } = req.query;
      let url = `${TQF_BASE_URL}/api/planetary/optimal-timing?tz=${tz || "UTC"}&lang=${lang || "en"}`;
      if (lat && lng) url += `&lat=${lat}&lng=${lng}`;
      const response = await fetch(url, {
        headers: { "x-api-key": TQF_API_KEY },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch optimal timing" });
    }
  });

  app.get("/api/proxy/sacred-geography/sites", async (req, res) => {
    try {
      const { lang, limit } = req.query;
      const cacheBust = `${lang || "en"}-${Date.now()}`;
      const response = await fetch(
        `${TQF_BASE_URL}/api/sacred-geography/sites?lang=${lang || "en"}&limit=${limit || 20}&_cb=${cacheBust}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
          cache: "no-store",
        }
      );
      const data = await response.json();
      res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      res.set('Vary', 'Accept-Language');
      res.removeHeader('ETag');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sacred sites" });
    }
  });

  app.get("/api/proxy/sacred-geography/ceremonial-timings", async (req, res) => {
    try {
      const { lang } = req.query;
      const cacheBust = `${lang || "en"}-${Date.now()}`;
      const response = await fetch(
        `${TQF_BASE_URL}/api/sacred-geography/ceremonial-timings?lang=${lang || "en"}&_cb=${cacheBust}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
          cache: "no-store",
        }
      );
      const data = await response.json();
      res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      res.set('Vary', 'Accept-Language');
      res.removeHeader('ETag');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ceremonial timings" });
    }
  });

  app.get("/api/proxy/sacred-geography/oral-traditions", async (req, res) => {
    try {
      const { lang, category } = req.query;
      const cacheBust = `${lang || "en"}-${Date.now()}`;
      let url = `${TQF_BASE_URL}/api/sacred-geography/oral-traditions?lang=${lang || "en"}&_cb=${cacheBust}`;
      if (category) url += `&category=${category}`;
      const response = await fetch(url, {
        headers: { "x-api-key": TQF_API_KEY },
        cache: "no-store",
      });
      const data = await response.json();
      res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      res.set('Vary', 'Accept-Language');
      res.removeHeader('ETag');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch oral traditions" });
    }
  });

  app.get("/api/proxy/sacred-geography/weather-prophecies", async (req, res) => {
    try {
      const { lang } = req.query;
      const cacheBust = `${lang || "en"}-${Date.now()}`;
      const response = await fetch(
        `${TQF_BASE_URL}/api/sacred-geography/weather-prophecies?lang=${lang || "en"}&_cb=${cacheBust}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
          cache: "no-store",
        }
      );
      const data = await response.json();
      res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      res.set('Vary', 'Accept-Language');
      res.removeHeader('ETag');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weather prophecies" });
    }
  });

  app.get("/api/proxy/sacred-geography/plant-medicine-timing", async (req, res) => {
    try {
      const { lang } = req.query;
      const cacheBust = `${lang || "en"}-${Date.now()}`;
      const response = await fetch(
        `${TQF_BASE_URL}/api/sacred-geography/plant-medicine-timing?lang=${lang || "en"}&_cb=${cacheBust}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
          cache: "no-store",
        }
      );
      const data = await response.json();
      res.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      res.set('Vary', 'Accept-Language');
      res.removeHeader('ETag');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plant medicine timing" });
    }
  });

  // Daily Cookie endpoint - generates/retrieves daily wisdom in requested language
  app.get("/api/proxy/cookie", async (req, res) => {
    try {
      const lang = (req.query.lang as string) || "en";
      const validLangs = ["en", "es", "fr", "de", "pt", "it"];
      const normalizedLang = validLangs.includes(lang) ? lang : "en";
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we already have today's cookie for this language
      const existing = await db.select().from(dailyCookies)
        .where(and(
          eq(dailyCookies.date, today),
          eq(dailyCookies.language, normalizedLang)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return res.json({ success: true, cookie: existing[0].cookie });
      }
      
      // Generate new cookie using OpenAI
      const languageNames: Record<string, string> = {
        en: "English",
        es: "Spanish",
        fr: "French",
        de: "German",
        pt: "Portuguese",
        it: "Italian",
      };
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a wise, poetic oracle who creates short, contemplative reflections. Generate a single fictional wisdom statement or reflection prompt. It should be:
- Mysterious but not dark
- Evocative and thought-provoking
- 1-2 sentences maximum
- Written in ${languageNames[normalizedLang]}
- In the style of a fortune cookie, but more cosmic/philosophical
- Never include quotes around the text
- Do not include any prefix like "Cookie:" or similar`,
          },
          {
            role: "user",
            content: `Generate today's contemplative reflection in ${languageNames[normalizedLang]}.`,
          },
        ],
        max_tokens: 100,
        temperature: 0.9,
      });
      
      const cookie = completion.choices[0]?.message?.content?.trim() || "";
      
      if (!cookie) {
        throw new Error("No cookie generated");
      }
      
      // Save to database
      await db.insert(dailyCookies).values({
        date: today,
        language: normalizedLang,
        cookie,
      });
      
      res.json({ success: true, cookie });
    } catch (error) {
      console.error("Cookie generation error:", error);
      // Fallback cookies for each language
      const fallbacks: Record<string, string[]> = {
        en: [
          "A door left ajar lets in more than light.",
          "The rain does not ask permission to fall.",
          "Even shadows need something to lean against.",
        ],
        es: [
          "Una puerta entreabierta deja entrar más que luz.",
          "La lluvia no pide permiso para caer.",
          "Incluso las sombras necesitan algo en qué apoyarse.",
        ],
        fr: [
          "Une porte entrouverte laisse entrer plus que la lumière.",
          "La pluie ne demande pas la permission de tomber.",
          "Même les ombres ont besoin de quelque chose sur quoi s'appuyer.",
        ],
        de: [
          "Eine angelehnte Tür lässt mehr als Licht herein.",
          "Der Regen fragt nicht um Erlaubnis zu fallen.",
          "Auch Schatten brauchen etwas, woran sie sich lehnen können.",
        ],
        pt: [
          "Uma porta entreaberta deixa entrar mais que luz.",
          "A chuva não pede permissão para cair.",
          "Até as sombras precisam de algo para se apoiar.",
        ],
        it: [
          "Una porta socchiusa lascia entrare più della luce.",
          "La pioggia non chiede il permesso di cadere.",
          "Anche le ombre hanno bisogno di qualcosa su cui appoggiarsi.",
        ],
      };
      const lang = (req.query.lang as string) || "en";
      const validLang = fallbacks[lang] ? lang : "en";
      const fallback = fallbacks[validLang][Math.floor(Math.random() * fallbacks[validLang].length)];
      res.json({ success: true, cookie: fallback });
    }
  });

  app.post("/api/seed/jewish-holidays", async (req, res) => {
    const adminKey = req.headers['x-admin-key'] as string | undefined;
    const expectedKey = process.env.ADMIN_SEED_KEY;
    
    if (!expectedKey) {
      return res.status(503).json({ error: "Seed endpoint not configured" });
    }
    
    if (!adminKey || adminKey.length !== expectedKey.length) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    let match = true;
    for (let i = 0; i < adminKey.length; i++) {
      if (adminKey.charCodeAt(i) !== expectedKey.charCodeAt(i)) {
        match = false;
      }
    }
    
    if (!match) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear + 1];
      const result = await seedMultipleYears(years);
      res.json({ 
        success: true, 
        message: `Seeded Jewish holidays for ${years.join(', ')}`,
        ...result 
      });
    } catch (error) {
      console.error("Failed to seed Jewish holidays:", error);
      res.status(500).json({ error: "Failed to seed Jewish holidays" });
    }
  });

  return httpServer;
}

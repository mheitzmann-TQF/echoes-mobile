import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

  // Daily Cookie endpoint - proxy to source
  app.get("/api/proxy/cookie", async (req, res) => {
    try {
      const { lang } = req.query;
      const response = await fetch(
        `${TQF_BASE_URL}/api/cookie?lang=${lang || "en"}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cookie" });
    }
  });

  return httpServer;
}

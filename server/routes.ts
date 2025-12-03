import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const TQF_API_KEY = process.env.TQF_MOBILE_API_KEY || "";
const TQF_BASE_URL = "https://source.thequietframe.com";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      });
      const data = await response.json();
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
      const response = await fetch(
        `${TQF_BASE_URL}/api/sacred-geography/living-calendars?lang=${lang || "en"}`,
        {
          headers: { "x-api-key": TQF_API_KEY },
        }
      );
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch living calendars" });
    }
  });

  app.get("/api/proxy/consciousness", async (req, res) => {
    try {
      const response = await fetch(
        `${TQF_BASE_URL}/api/consciousness`,
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

  return httpServer;
}

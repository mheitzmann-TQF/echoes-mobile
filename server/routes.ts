import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";

const SOURCE_API = "https://source.thequietframe.com";

async function proxyToSource(path: string, query: Record<string, any> = {}): Promise<any> {
  const params = new URLSearchParams(query).toString();
  const url = `${SOURCE_API}${path}${params ? `?${params}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Source API error: ${response.status}`);
  }
  return response.json();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Proxy route for wisdom cycle (forwards to source.thequietframe.com)
  app.get("/api/proxy/wisdom/cycle", async (req, res) => {
    try {
      const data = await proxyToSource("/api/wisdom/cycle", req.query as Record<string, string>);
      res.json(data);
    } catch (error: any) {
      console.error("Wisdom cycle proxy error:", error?.message);
      res.status(500).json({ error: "Failed to fetch wisdom cycle" });
    }
  });

  // Proxy route for geocoding (forwards to source.thequietframe.com)
  app.get("/api/proxy/geocode", async (req, res) => {
    try {
      const data = await proxyToSource("/api/geocode", req.query as Record<string, string>);
      res.json(data);
    } catch (error: any) {
      console.error("Geocode proxy error:", error?.message);
      res.status(500).json({ error: "Location not found" });
    }
  });

  // User Settings Routes (in-memory storage for development)
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

  return httpServer;
}

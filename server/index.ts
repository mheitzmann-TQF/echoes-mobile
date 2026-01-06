import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Set up frontend serving - either static files (production) or status page (development)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // In development, serve a status page at root (mobile app runs locally via Expo)
    app.get("/", (_req: Request, res: Response) => {
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Echoes API Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .moon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f5f5f5 0%, #c9c9c9 100%);
      border-radius: 50%;
      margin: 0 auto 2rem;
      box-shadow: 0 0 40px rgba(255,255,255,0.2);
    }
    h1 {
      font-size: 2rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      letter-spacing: 0.1em;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255,255,255,0.1);
      padding: 0.5rem 1rem;
      border-radius: 2rem;
      margin: 1.5rem 0;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .info {
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
      line-height: 1.6;
      max-width: 400px;
    }
    code {
      background: rgba(255,255,255,0.1);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="moon"></div>
    <h1>ECHOES</h1>
    <div class="status">
      <div class="dot"></div>
      <span>API Server Running</span>
    </div>
    <p class="info">
      The mobile app connects to this API server.<br>
      Run locally with <code>npx expo start --dev-client</code>
    </p>
  </div>
</body>
</html>
      `);
    });

    log("Serving API server with status page at root");
  }

  // Use port 5000 for Replit preview, fallback to 5050 for local development
  const port = parseInt(process.env.PORT || "5000", 10);

  // Bind to all interfaces for Replit, loopback for local
  const host = process.env.REPLIT_DEV_DOMAIN ? "0.0.0.0" : (process.env.HOST || "127.0.0.1");

  httpServer.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
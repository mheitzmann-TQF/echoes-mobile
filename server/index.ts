import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

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

  // Set up frontend serving - either static files (production) or Expo Metro proxy (development)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // In development, proxy all non-API requests to Expo Metro bundler
    // Replit: Expo web runs on 8081, Express proxies from 5000
    // Local Mac: Run Expo separately (expo start --dev-client) and API server (npm run server)
    const METRO_PORT = parseInt(process.env.METRO_PORT || "8081", 10);

    const metroProxy = createProxyMiddleware({
      target: `http://localhost:${METRO_PORT}`,
      changeOrigin: true,
      ws: true,
      on: {
        error: (err: Error, _req: any, res: any) => {
          log(
            `Proxy error: ${err.message} - Is Expo Metro running on port ${METRO_PORT}?`,
            "proxy",
          );
          if (res && !res.headersSent) {
            res.writeHead(503, { "Content-Type": "text/html" });
            res.end(`
<!DOCTYPE html>
<html><head><title>Echoes - Starting...</title>
<style>
  body { font-family: system-ui; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .container { text-align: center; }
  h1 { font-weight: 300; letter-spacing: 0.1em; }
  p { color: #888; margin-top: 1rem; }
  .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin: 2rem auto; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>ECHOES</h1>
    <p>Waiting for Expo Metro bundler on port ${METRO_PORT}...</p>
  </div>
</body>
</html>
            `);
          }
        },
      },
    });

    app.use("/", metroProxy);

    // Handle WebSocket upgrades for Metro hot reload
    httpServer.on("upgrade", (req, socket, head) => {
      if (metroProxy.upgrade) {
        metroProxy.upgrade(req, socket as any, head);
      }
    });

    log(`Proxying frontend requests to Expo Metro on port ${METRO_PORT}`);
  }

  // Port 5000 for Replit webview, 5050 for local development alongside Expo
  const port = parseInt(process.env.PORT || "5000", 10);

  // Bind to all interfaces for Replit, loopback for local
  const host = process.env.REPLIT_DEV_DOMAIN ? "0.0.0.0" : (process.env.HOST || "127.0.0.1");

  httpServer.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
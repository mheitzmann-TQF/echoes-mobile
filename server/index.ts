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

  // Set up frontend serving - either static files (production) or Metro proxy (development)
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    // In development, proxy all non-API requests to Expo Metro bundler on port 8081
    const METRO_PORT = 8081;

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
            res.writeHead(503, { "Content-Type": "text/plain" });
            res.end(
              `Expo Metro not available. Run 'expo start --port ${METRO_PORT}' first.`,
            );
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

  // Default to 5050 locally to avoid clashing with Expo web on 5000.
  // Replit / prod will provide PORT via environment.
  const port = parseInt(process.env.PORT || "5050", 10);

  // Default to loopback for local dev.
  // Replit / prod can override with HOST=0.0.0.0
  const host = process.env.HOST || "127.0.0.1";

  httpServer.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
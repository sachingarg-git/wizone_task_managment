import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { domainValidationMiddleware, setupDomainCORS } from "./domain-config";
import { initializeDailyNotificationScheduler } from "./scheduled-notifications";
// Database will be imported dynamically after setup is complete

const app = express();

// Enable gzip compression for all responses (reduces network transfer by 70-80%)
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Balance between speed and compression ratio
}));

// Increase body parser limit for file uploads (allow up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Setup domain validation and CORS for custom domains
setupDomainCORS(app);
app.use(domainValidationMiddleware);

// Trust proxy for production hosting behind load balancers/reverse proxies
app.set('trust proxy', true);

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Initialize database with proper connection and tables
    console.log("🔗 Initializing database connection...");
    await import("./database-init.js").then(module => module.initializeDatabase());
    console.log("✅ Database initialization successful");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    console.log("⚠️ Continuing with fallback mode...");
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error('Server error:', err);
    // Don't throw error to prevent server crash
  });

  // Use production mode when running from dist (compiled code)
  console.log("Environment:", process.env.NODE_ENV);
  
  // Check if we're running from dist folder (production) or source folder (development)
  const isProduction = import.meta.dirname.includes('dist');
  
  if (isProduction) {
    console.log("Running in PRODUCTION mode - serving static files");
    serveStatic(app);
  } else {
    console.log("Running in DEVELOPMENT mode - using Vite dev server");
    await setupVite(app, server);
  }

  // Use alternative port (avoiding 3000 and 5000)
  // Serve the app on port 4000 for production, 3007 for development
  const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 3007 : 4000);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    
    // Initialize the daily notification scheduler (8 PM IST daily summary)
    try {
      initializeDailyNotificationScheduler();
      console.log("✅ Daily notification scheduler initialized");
    } catch (error) {
      console.error("⚠️ Failed to initialize daily notification scheduler:", error);
    }
  });
})();

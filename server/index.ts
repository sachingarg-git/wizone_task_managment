import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { domainValidationMiddleware, setupDomainCORS } from "./domain-config";
import { initializeDailyNotificationScheduler, initialize3HourTaskScheduler } from "./scheduled-notifications";
// Database will be imported dynamically after setup is complete

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason);
  // Don't exit the process, just log it
});

process.on('uncaughtException', (error) => {
  console.error('⚠️ Uncaught Exception:', error);
  // Don't exit the process, just log it
});

process.on('exit', (code) => {
  console.error(`\n🚨 🚨 🚨 PROCESS IS EXITING WITH CODE: ${code} 🚨 🚨 🚨`);
  console.error('Stack trace at exit:');
  console.trace();
});

process.on('beforeExit', (code) => {
  console.error(`\n⚠️ BEFORE EXIT EVENT - Code: ${code}`);
  console.error('Event loop is empty, process is about to exit');
  console.trace();
});

// Override SIGINT/SIGTERM handlers to prevent tsx from killing the server
process.on('SIGINT', () => {
  console.log('\n⚠️ SIGINT received - but keeping server running (tsx trying to restart)');
  // Don't exit - just log it
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ SIGTERM received - but keeping server running');
  // Don't exit - just log it
});

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
  
  let server;
  try {
    server = await registerRoutes(app);
    console.log("✅ Server object created:", server ? "SUCCESS" : "FAILED - SERVER IS UNDEFINED!");
  } catch (error) {
    console.error("❌ Error registering routes:", error);
    console.log("⚠️ Some features may not be available");
    // Create a basic server anyway
    const http = await import("http");
    server = http.createServer(app);
    console.log("✅ Fallback HTTP server created");
  }

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
    try {
      await setupVite(app, server);
      console.log("✅ Vite dev server setup completed successfully");
    } catch (viteError) {
      console.error("❌ Vite setup failed:", viteError);
      console.error("❌ Vite error stack:", viteError instanceof Error ? viteError.stack : 'No stack trace');
      console.log("⚠️ Continuing without Vite");
    }
  }

  // Use alternative port (avoiding 3000 and 5000)
  // Serve the app on port 4000 for production, 5000 for development
  const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 5000 : 4000);
  
  console.log("🔍 About to call server.listen with server:", server ? "DEFINED" : "UNDEFINED");
  console.log("🔍 Server type:", typeof server);
  
  const listening = server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
    
    // Keep the process alive with a heartbeat interval
    setInterval(() => {
      // Heartbeat to keep event loop alive
      const uptime = process.uptime();
      if (uptime % 300 === 0) { // Log every 5 minutes
        console.log(`✅ Server heartbeat - uptime: ${Math.floor(uptime / 60)} minutes`);
      }
    }, 1000); // Check every second
    
    // Initialize the daily notification scheduler (8 PM IST daily summary) - DISABLED
    // try {
    //   initializeDailyNotificationScheduler();
    //   console.log("✅ Daily notification scheduler status logged");
    // } catch (error) {
    //   console.error("⚠️ Failed to log daily notification scheduler status:", error);
    // }

    // Initialize the NEW 3-hour pending/in-progress task notification - TEMPORARILY DISABLED FOR DEBUGGING
    // try {
    //   initialize3HourTaskScheduler();
    //   console.log("✅ 3-hour task notification scheduler initialized");
    // } catch (error) {
    //   console.error("⚠️ Failed to initialize 3-hour task scheduler:", error);
    // }
    
    console.log("🚀 Server running successfully! All schedulers temporarily disabled for debugging.");
  });
  
  console.log("✅ server.listen() call completed, returned:", listening ? "SERVER INSTANCE" : "UNDEFINED");
})().catch((error) => {
  console.error("❌ Fatal error during server startup:", error);
  console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
  console.error("❌ Error details:", JSON.stringify(error, null, 2));
  process.exit(1);
});

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { domainValidationMiddleware, setupDomainCORS } from "./domain-config";
import { db } from "./db.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup domain validation and CORS for custom domains
setupDomainCORS(app);
// app.use(domainValidationMiddleware); // Temporarily disabled for debugging

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
  // Database connection is automatically established via Drizzle ORM
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve static files for testing
  app.use('/public', express.static('public'));

  // Add simple test routes
  app.get('/test', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Server Test</title></head>
        <body style="font-family: Arial; padding: 20px; background: #22c55e; color: white;">
          <h1>✅ Server is Working!</h1>
          <p>If you see this, the Express server is functioning correctly.</p>
          <p>Time: ${new Date().toISOString()}</p>
          <a href="/simple" style="color: white;">Test Simple Page</a> | 
          <a href="/" style="color: white;">Go to Main App</a>
        </body>
      </html>
    `);
  });

  // Bypass Vite entirely for testing
  app.get('/simple', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Simple Test</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div id="root"></div>
          <script>
            console.log('=== SIMPLE PAGE SCRIPT EXECUTING ===');
            const root = document.getElementById('root');
            console.log('Root found:', root);
            
            if (root) {
              root.innerHTML = \`
                <div style="
                  min-height: 100vh; 
                  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                  color: white; 
                  padding: 40px; 
                  font-family: Arial, sans-serif;
                  text-align: center;
                ">
                  <h1 style="font-size: 3rem; margin-bottom: 20px;">🎯 SIMPLE TEST SUCCESS!</h1>
                  <p style="font-size: 1.5rem; margin-bottom: 30px;">If you see this orange page, the problem is with Vite/React setup.</p>
                  <p style="margin-bottom: 20px;">This proves the server and basic JavaScript work correctly.</p>
                  <div style="margin-top: 30px;">
                    <a href="/test" style="
                      color: white; 
                      text-decoration: none; 
                      padding: 10px 20px; 
                      background: rgba(255,255,255,0.2); 
                      border-radius: 5px; 
                      margin-right: 10px;
                    ">← Back to Test</a>
                    <a href="/" style="
                      color: white; 
                      text-decoration: none; 
                      padding: 10px 20px; 
                      background: rgba(255,255,255,0.2); 
                      border-radius: 5px;
                    ">Try Main App →</a>
                  </div>
                </div>
              \`;
              console.log('Simple page render complete');
            } else {
              document.body.innerHTML = '<div style="background: red; color: white; padding: 20px;">Root element not found!</div>';
            }
          </script>
        </body>
      </html>
    `);
  });

  // Force development mode for deployment since build process times out
  console.log("Environment:", process.env.NODE_ENV);
  console.log("Setting up Vite development server for deployment compatibility");
  await setupVite(app, server);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

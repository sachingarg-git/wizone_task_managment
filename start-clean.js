// Clean startup script for Windows - no user seeding
import express from "express";
import { registerRoutes } from "./server/routes.js";
import { setupVite } from "./server/vite.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

console.log("Starting clean server without user seeding...");

(async () => {
  const server = await registerRoutes(app);
  
  console.log("Environment:", process.env.NODE_ENV || "development");
  await setupVite(app, server);
  
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
    console.log("Login with: admin / admin123");
  });
})();
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: 7 * 24 * 60 * 60, // 7 days
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-session-secret-here",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Login endpoint
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Register endpoint (for creating new users)
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, password, firstName, lastName, email, role = "engineer", department } = req.body;
      
      if (!username || !password || !firstName || !lastName || !email) {
        return res.status(400).json({ message: "Username, password, first name, last name, and email are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUserWithPassword({
        id: username,
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        role,
        department,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
}

export async function createDefaultUsers() {
  try {
    // Create default admin user if it doesn't exist
    const adminExists = await storage.getUserByUsername("admin");
    if (!adminExists) {
      // Check if there's already a user with this email and update it
      const existingUser = await storage.getUserByEmail("admin@taskflow.com");
      if (existingUser) {
        const hashedPassword = await hashPassword("admin123");
        await storage.updateUser(existingUser.id, {
          username: "admin",
          password: hashedPassword,
          role: "admin",
        });
        console.log("Updated existing user to admin: admin/admin123");
      } else {
        const hashedPassword = await hashPassword("admin123");
        await storage.createUserWithPassword({
          id: "admin",
          username: "admin",
          password: hashedPassword,
          firstName: "System",
          lastName: "Administrator",
          email: "admin@taskflow.com",
          role: "admin",
          department: "IT",
        });
        console.log("Created default admin user: admin/admin123");
      }
    }

    // Create default manager user
    const managerExists = await storage.getUserByUsername("manager");
    if (!managerExists) {
      const hashedPassword = await hashPassword("manager123");
      await storage.createUserWithPassword({
        id: "manager",
        username: "manager",
        password: hashedPassword,
        firstName: "Project",
        lastName: "Manager",
        email: "manager@taskflow.com",
        role: "manager",
        department: "Operations",
      });
      console.log("Created default manager user: manager/manager123");
    }

    // Create default engineer user
    const engineerExists = await storage.getUserByUsername("engineer");
    if (!engineerExists) {
      const hashedPassword = await hashPassword("engineer123");
      await storage.createUserWithPassword({
        id: "engineer",
        username: "engineer",
        password: hashedPassword,
        firstName: "Field",
        lastName: "Engineer",
        email: "engineer@taskflow.com",
        role: "field_engineer",
        department: "Field Operations",
      });
      console.log("Created default engineer user: engineer/engineer123");
    }
  } catch (error) {
    console.error("Error creating default users:", error);
  }
}
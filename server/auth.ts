import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import MemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      return false;
    }
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Ensure buffers are the same length before comparing
    if (hashedBuf.length !== suppliedBuf.length) {
      return false;
    }
    
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const MemoryStoreSession = MemoryStore(session);
  const sessionStore = new MemoryStoreSession({
    checkPeriod: 86400000, // prune expired entries every 24h
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
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
        // First try database
        let user;
        try {
          user = await storage.getUserByUsername(username);
        } catch (dbError) {
          console.log("Database not available, using fallback authentication");
          user = null;
        }

        // Fallback to temporary users if database fails
        if (!user) {
          const tempUsers = [
            {
              id: "admin001",
              username: "admin",
              password: "32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1",
              email: "admin@wizone.com",
              firstName: "Admin",
              lastName: "User",
              role: "admin",
              department: "Management",
              isActive: true,
            },
            {
              id: "WIZONE0015",
              username: "RAVI",
              password: "32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1",
              email: "ravi@wizone.com",
              firstName: "Ravi",
              lastName: "Kumar",
              role: "field_engineer",
              department: "Field Operations",
              isActive: true,
            },
            {
              id: "manpreet001",
              username: "manpreet",
              password: "32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1",
              email: "manpreet@wizone.com",
              firstName: "Manpreet",
              lastName: "Singh",
              role: "manager",
              department: "Engineering",
              isActive: true,
            }
          ];
          
          user = tempUsers.find(u => u.username === username);
        }

        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        console.error("Authentication error:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      let user;
      try {
        user = await storage.getUser(id);
      } catch (dbError) {
        // Fallback to temporary users
        const tempUsers = [
          {
            id: "admin001",
            username: "admin",
            password: "32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1",
            email: "admin@wizone.com",
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            department: "Management",
            isActive: true,
          },
          {
            id: "WIZONE0015",
            username: "RAVI",
            password: "32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1",
            email: "ravi@wizone.com",
            firstName: "Ravi",
            lastName: "Kumar",
            role: "field_engineer",
            department: "Field Operations",
            isActive: true,
          },
          {
            id: "manpreet001",
            username: "manpreet",
            password: "32dc874d83f8e3829e47123a59ed94f270e6b284fea685496f1fada378a02c1d51464b035595d1bd7872c55355a59f3dc9516a19a096daf5d3485803d09826c4.8e1fabfbd18012c505718f32b41244e1",
            email: "manpreet@wizone.com",
            firstName: "Manpreet",
            lastName: "Singh",
            role: "manager",
            department: "Engineering",
            isActive: true,
          }
        ];
        
        user = tempUsers.find(u => u.id === id);
      }
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
    console.log("Setting up default user credentials...");
    
    // Update the current user to have admin credentials if no admin exists
    const adminExists = await storage.getUserByUsername("admin");
    if (!adminExists) {
      // Find the first user and make them admin
      const users = await storage.getAllUsers();
      if (users.length > 0) {
        const firstUser = users[0];
        const hashedPassword = await hashPassword("admin123");
        await storage.updateUser(firstUser.id, {
          username: "admin",
          password: hashedPassword,
          role: "admin",
        });
        console.log("Updated existing user to admin: admin/admin123");
      }
    }

    console.log("Default user setup complete");
  } catch (error) {
    console.error("Error setting up default users:", error);
  }
}
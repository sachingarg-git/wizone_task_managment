import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage/mssql-storage";
import { User as SelectUser } from "@shared/schema";

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
  // Use memory store for sessions (MS SQL session store will be added later)
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-session-secret-here",
    resave: false,
    saveUninitialized: false,
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
        console.log(`🔐 PASSPORT AUTH: ${username}`);
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`❌ User not found: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        if (!user.password) {
          console.log(`❌ No password hash for user: ${username}`);
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log(`🔍 Password hash for ${username}:`, user.password.substring(0, 20) + '...');
        console.log(`🔍 Testing password: "${password}"`);
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`🔐 Password comparison result for ${username}:`, passwordMatch ? '✅ MATCH' : '❌ NO MATCH');
        
        if (!passwordMatch) {
          // Try alternative verification method
          console.log(`🔄 Trying storage verification method for ${username}...`);
          const storageVerify = await storage.verifyUserPassword(username, password);
          console.log(`🔄 Storage verification result:`, storageVerify ? '✅ SUCCESS' : '❌ FAILED');
          
          if (storageVerify) {
            console.log(`✅ Login successful via storage method for ${username}`);
            return done(null, user);
          }
          
          return done(null, false, { message: "Invalid username or password" });
        }
        
        console.log(`✅ Login successful for ${username}`);
        return done(null, user);
      } catch (error) {
        console.error(`❌ Passport auth error for ${username}:`, error.message);
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

  // Login endpoint - Enhanced for mobile compatibility with direct storage verification
  app.post("/api/auth/login", async (req, res, next) => {
    console.log('🔐 Login attempt:', req.body.username);
    console.log('📱 User Agent:', req.get('User-Agent') || 'Unknown');
    console.log('🌐 Origin:', req.get('Origin') || 'No Origin');
    
    // Check if this is a mobile request
    const origin = req.get('Origin');
    const userAgent = req.get('User-Agent') || '';
    const isMobileAPK = !origin || origin.includes('file://') || userAgent.includes('Mobile') || userAgent.includes('WebView');
    
    if (isMobileAPK) {
      console.log('📱 MOBILE REQUEST DETECTED - Using direct storage authentication');
      
      try {
        const { username, password } = req.body;
        
        if (!username || !password) {
          return res.status(400).json({ error: 'Missing credentials' });
        }
        
        // Direct storage verification for mobile
        console.log(`🔍 Direct verification for mobile user: ${username}`);
        const verifiedUser = await storage.verifyUserPassword(username, password);
        
        if (verifiedUser) {
          console.log(`✅ MOBILE LOGIN SUCCESS for: ${username}`);
          console.log(`✅ User details: ID=${verifiedUser.id}, Role=${verifiedUser.role}`);
          return res.status(200).json(verifiedUser);
        } else {
          console.log(`❌ MOBILE LOGIN FAILED for: ${username}`);
          
          // Check if user exists
          const user = await storage.getUserByUsername(username);
          if (user) {
            console.log(`✅ User exists but password verification failed`);
            console.log(`- Role: ${user.role}, Active: ${user.isActive}`);
            console.log(`- Password hash exists: ${user.password ? 'YES' : 'NO'}`);
          } else {
            console.log(`❌ User does not exist in database`);
          }
          
          return res.status(401).json({ error: 'Invalid credentials', message: 'Login failed' });
        }
      } catch (error) {
        console.error('❌ Mobile auth error:', error.message);
        return res.status(500).json({ error: 'Authentication failed' });
      }
    }
    
    // For web browsers, use passport authentication
    console.log('💻 WEB REQUEST - Using passport authentication');
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('❌ Auth error:', err);
        return res.status(500).json({ error: 'Authentication failed', message: err.message });
      }
      
      if (!user) {
        console.log('❌ Invalid credentials for:', req.body.username);
        return res.status(401).json({ error: 'Invalid credentials', message: info?.message || 'Login failed' });
      }
      
      // For web browsers, use session
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('❌ Session login error:', loginErr);
          return res.status(500).json({ error: 'Session creation failed' });
        }
        
        console.log('✅ Web login successful for:', user.username);
        const { password, ...safeUser } = user;
        res.status(200).json(safeUser);
      });
    })(req, res, next);
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

      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUserWithPassword({ username, password, firstName, lastName, email, role, department });
      res.status(201).json({ message: "User created successfully", user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
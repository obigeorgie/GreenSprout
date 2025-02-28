import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

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
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        console.error("Local strategy error:", error);
        return done(error as Error);
      }
    }),
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google OAuth callback received for profile:", {
            id: profile.id,
            displayName: profile.displayName,
            email: profile.emails?.[0]?.value
          });

          if (!profile.emails?.[0]?.value) {
            console.error("No email provided by Google");
            return done(new Error("No email provided by Google"));
          }

          let user = await storage.getUserByEmail(profile.emails[0].value);

          if (!user) {
            console.log("Creating new user from Google profile");
            user = await storage.createUser({
              username: profile.displayName,
              email: profile.emails[0].value,
              password: await hashPassword(randomBytes(32).toString("hex")), // Random password for OAuth users
            });
            console.log("Created new user:", { id: user.id, username: user.username });
          } else {
            console.log("Found existing user:", { id: user.id, username: user.username });
          }

          return done(null, user);
        } catch (error) {
          console.error("Google strategy error:", error);
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", { id: user.id, username: user.username });
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log("Deserializing user:", { id });
      const user = await storage.getUser(id);
      if (!user) {
        console.warn("User not found during deserialization:", { id });
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialization error:", error);
      done(error as Error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("Logging out user:", req.user);
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthenticated user requested /api/user");
      return res.sendStatus(401);
    }
    console.log("Authenticated user requested /api/user:", req.user);
    res.json(req.user);
  });

  // Google OAuth routes with improved error handling and logging
  app.get(
    "/auth/google",
    (req, res, next) => {
      console.log("Starting Google OAuth flow");
      next();
    },
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      prompt: "select_account"  // Always show Google account selector
    })
  );

  app.get(
    "/auth/google/callback",
    (req, res, next) => {
      console.log("Received Google OAuth callback");
      passport.authenticate("google", {
        failureRedirect: "/auth",
        failureMessage: true,
      })(req, res, next);
    },
    (req, res) => {
      console.log("Google OAuth successful, redirecting to home");
      res.redirect("/");
    }
  );

  // Error handling middleware
  app.use((error: Error, req: any, res: any, next: any) => {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Authentication error occurred" });
  });
}
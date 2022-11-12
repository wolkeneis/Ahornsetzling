import express, { RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import createSessionFileStore from "session-file-store";
import { Profile } from "./database/database-adapter.js";
import { env, envRequire } from "./environment.js";

const FileStore = createSessionFileStore(session);

export const sessionMiddleware: express.RequestHandler = session({
  store: new FileStore(),
  secret: envRequire("SECRET"),
  resave: true,
  saveUninitialized: true,
  cookie: {
    path: "/",
    sameSite: "none",
    httpOnly: true,
    secure: true,
    maxAge: 604800000
  }
});

export const passportMiddleware: RequestHandler = passport.initialize();

export const passportSessionMiddleware: RequestHandler = passport.session();

export const ensureLoggedIn = (redirect?: string): RequestHandler => {
  return async (req, res, next) => {
    if (req.isAuthenticated()) {
      const profile = req.user as Profile;
      if (profile.scopes?.includes(env("STRICT") && env("STRICT") === "true" ? "restricted" : "user")) {
        return next();
      } else {
        console.warn(`${profile.username} (${profile.uid}) is not whitelisted and tried to access ${req.originalUrl}`);
        if (req.method !== "GET" || !redirect) {
          return res.sendStatus(403);
        }
        return res.redirect(redirect);
      }
    } else {
      console.log(`${req.ip} tried to access ${req.originalUrl} without being logged in`);
      if (req.method !== "GET" || !redirect) {
        return res.sendStatus(401);
      }
      return res.redirect(redirect);
    }
  };
};

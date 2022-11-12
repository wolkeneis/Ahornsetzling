import type { Request } from "express";
import { cdn_api_v1 as v1, moos_api_v1 } from "moos-api";
import passport from "passport";
import WolkeneisStrategy from "passport-wolkeneis";
import { Profile } from "./database/database-adapter.js";
import database from "./database/index.js";
import { envRequire } from "./environment.js";

passport.serializeUser((user, done) => {
  done(null, (user as v1.UserProfile).uid);
});

passport.deserializeUser(async (uid: string, done) => {
  try {
    const user = await database.profileFindById({ uid: uid });
    done(null, user);
  } catch (error) {
    done(error as Error);
  }
});

passport.use(
  new WolkeneisStrategy(
    {
      clientID: envRequire("CLIENT_ID"),
      clientSecret: envRequire("CLIENT_SECRET"),
      callbackURL: envRequire("CALLBACK_URL"),
      authorizationURL: envRequire("AUTH_URL"),
      tokenURL: envRequire("TOKEN_URL"),
      userProfileUrl: envRequire("PROFILE_URL"),
      passReqToCallback: true,
      scope: ["identify"]
    },
    (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: moos_api_v1.paths["/application/profile"]["get"]["responses"]["200"]["content"]["application/json"],
      done: (error?: Error | null, user?: Profile, info?: object) => void
    ) => {
      database.profilePatch({
        ...profile,
        scopes: undefined
      });
      done(null, profile);
    }
  )
);

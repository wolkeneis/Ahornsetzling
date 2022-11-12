import express from "express";
import { Profile } from "../database/database-adapter";
import { env } from "../environment.js";

const router = express.Router();

router.post("/", (req, res) => {
  if (req.isAuthenticated()) {
    const profile = req.user as Profile;
    res.json({
      username: profile.username,
      avatar: profile.avatar,
      authorized: profile.scopes?.includes(env("STRICT") && env("STRICT") === "true" ? "restricted" : "user")
    });
  } else {
    res.sendStatus(403);
  }
});

router.delete("/", (req, res) => {
  if (req.isAuthenticated()) {
    req.logout({ keepSessionInfo: false }, (error) => console.error(error));
  }
  res.redirect(`${env("CONTROL_ORIGIN") ?? "https://ahornwald.wolkeneis.dev"}/redirect/nodes`);
});

export default router;

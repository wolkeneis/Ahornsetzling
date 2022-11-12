import express, { Router } from "express";
import passport from "passport";
import { env } from "../environment.js";
import "../strategies.js";

const router: Router = express.Router();

router.get("/", passport.authenticate("wolkeneis"));

router.get(
  "/callback",
  passport.authenticate("wolkeneis", {
    failureRedirect: "/"
  }),
  (req, res) => {
    res.redirect(`${env("CONTROL_ORIGIN") ?? "https://ahornwald.wolkeneis.dev"}/redirect/nodes`);
  }
);

export default router;

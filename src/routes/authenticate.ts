import express, { Router } from "express";
import passport from "passport";
import "../strategies.js";

const router: Router = express.Router();

router.get("/", passport.authenticate("wolkeneis"));

router.get(
  "/callback",
  passport.authenticate("wolkeneis", {
    failureRedirect: "/"
  }),
  (req, res) => {
    res.redirect(process.env.CONTROL_ORIGIN + "/redirect/nodes");
  }
);

export default router;

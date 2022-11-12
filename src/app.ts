import cors from "cors";
import express from "express";
import "./database/index.js";
import { env } from "./environment.js";
import { passportMiddleware, passportSessionMiddleware, sessionMiddleware } from "./middleware.js";
import { authenticate, collection, collections, episode, file, profile, season, source, subtitle } from "./routes/index.js";
import "./strategies.js";

const app = express();

app.set("trust proxy", 2);

const whitelist = [
  env("CONTROL_ORIGIN") ?? "https://ahornwald.wolkeneis.dev",
  env("CONTROL_ORIGIN_2") ?? "https://wolkeneis.dev",
  env("CONTROL_ORIGIN_3") ?? "https://_application.wolkeneis.dev"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS: " + origin));
      }
    },
    allowedHeaders: "X-Requested-With, Content-Type",
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);
app.use(passportMiddleware);
app.use(passportSessionMiddleware);

app.use("/authenticate", authenticate);
app.use("/profile", profile);
app.use("/file", file);
app.use("/collections", collections);
app.use("/collection", collection);
app.use("/season", season);
app.use("/episode", episode);
app.use("/source", source);
app.use("/subtitle", subtitle);

app.get("/", (req, res) => {
  res.json({
    state: process.env.STATE ?? "maintenance",
    name: process.env.CLIENT_NAME || "Content Node"
  });
});

export const server = app.listen(env("PORT") || 5000);

export default app;

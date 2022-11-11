import express, { Router } from "express";
import type { cdn_api_v1 as v1 } from "moos-api";
import { v4 as uuidv4 } from "uuid";
import { Visibility, type Profile } from "../database/database-adapter.js";
import database from "../database/index.js";
import { ensureLoggedIn } from "../middleware.js";

const router: Router = express.Router();

router.use(ensureLoggedIn());

router.post("/episode", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/episode"]["post"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || !body.seasonId) {
    return res.sendStatus(400);
  }
  try {
    const episode = await database.episodeFind({ seasonId: body.seasonId, episodeId: body.id });
    if (!episode) {
      return res.sendStatus(404);
    }
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid && collection.visibility === Visibility.private) {
      return res.sendStatus(403);
    }
    const sources = await Promise.all(
      (episode.sources ?? []).map(async (sourceId) => {
        const source = await database.sourceFind({ sourceId });
        return {
          ...source,
          key: source.key,
          subtitles: source.subtitles ?? undefined
        };
      })
    );
    const subtitles = await Promise.all((episode.subtitles ?? []).map(async (subtitleId) => await database.subtitleFind({ subtitleId })));
    const response: v1.paths["/episode"]["post"]["responses"]["200"]["content"]["application/json"] = {
      seasonId: season.id,
      id: episode.id,
      index: episode.index,
      name: episode.name,
      sources: sources ?? [],
      subtitles: subtitles ?? [],
      creationDate: episode.creationDate
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.put("/episode", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/episode"]["put"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.seasonId || body.index === undefined || !body.name) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    const episodeId = uuidv4();
    const episode = await database.episodeCreate({
      seasonId: season.id,
      id: episodeId,
      index: body.index,
      name: body.name
    });
    const response: v1.paths["/episode"]["put"]["responses"]["200"]["content"]["application/json"] = {
      seasonId: season.id,
      id: episode.id,
      index: episode.index,
      name: episode.name,
      sources: [],
      subtitles: [],
      creationDate: episode.creationDate
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.patch("/episode", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/episode"]["patch"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || !body.seasonId || !(body.index !== undefined || body.name)) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.episodePatch({
      seasonId: body.seasonId,
      episodeId: body.id,
      index: body.index,
      name: body.name
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.delete("/episode", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/episode"]["delete"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || !body.seasonId) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.episodeDelete({
      seasonId: body.seasonId,
      episodeId: body.id
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

export default router;

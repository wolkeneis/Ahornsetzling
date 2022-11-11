import express, { Router } from "express";
import type { cdn_api_v1 as v1 } from "moos-api";
import { v4 as uuidv4 } from "uuid";
import { Visibility, type Profile } from "../database/database-adapter.js";
import database from "../database/index.js";
import { ensureLoggedIn } from "../middleware.js";

const router: Router = express.Router();

router.use(ensureLoggedIn());

router.post("/season", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/season"]["post"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.id });
    if (!season) {
      return res.sendStatus(404);
    }
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid && collection.visibility === Visibility.private) {
      return res.sendStatus(403);
    }
    const response: v1.paths["/season"]["post"]["responses"]["200"]["content"]["application/json"] = {
      collectionId: season.collectionId,
      id: season.id,
      index: season.index,
      episodes: await Promise.all(
        (
          await Promise.all(
            (season.episodes ?? []).map(async (episodeId) => await database.episodeFind({ episodeId: episodeId, seasonId: season.id }))
          )
        ).map(async (episode) => ({
          ...episode,
          sources: (
            await Promise.all((episode.sources ?? []).map(async (sourceId) => await database.sourceFind({ sourceId: sourceId })))
          ).map((source) => ({
            ...source,
            key: source.key,
            language: source.language,
            subtitles: source.subtitles ?? undefined
          })),
          subtitles: await Promise.all((episode.subtitles ?? []).map(async (subtitleId) => await database.subtitleFind({ subtitleId: subtitleId })))
        }))
      ),
      languages: season.languages ?? [],
      subtitles: season.subtitles ?? []
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.put("/season", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/season"]["put"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.collectionId || body.index === undefined) {
    return res.sendStatus(400);
  }
  try {
    const collection = await database.collectionFind({ collectionId: body.collectionId });
    if (!collection) {
      return res.sendStatus(404);
    }
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    const seasonId = uuidv4();
    const season = await database.seasonCreate({
      collectionId: collection.id,
      id: seasonId,
      index: body.index
    });
    const response: v1.paths["/season"]["put"]["responses"]["200"]["content"]["application/json"] = {
      collectionId: season.collectionId,
      id: season.id,
      index: season.index,
      episodes: [],
      languages: [],
      subtitles: []
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.patch("/season", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/season"]["patch"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || body.index === undefined) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.id });
    if (!season) {
      return res.sendStatus(404);
    }
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.seasonPatch({
      seasonId: body.id,
      index: body.index
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.delete("/season", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/season"]["delete"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.id });
    if (!season) {
      return res.sendStatus(404);
    }
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.seasonDelete({
      seasonId: body.id
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

export default router;

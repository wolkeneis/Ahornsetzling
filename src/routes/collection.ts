import express, { Router } from "express";
import type { cdn_api_v1 as v1 } from "moos-api";
import { v4 as uuidv4 } from "uuid";
import { File, Visibility, type Profile } from "../database/database-adapter.js";
import database from "../database/index.js";
import { ensureLoggedIn } from "../middleware.js";

const router: Router = express.Router();

router.use(ensureLoggedIn());

router.post("/", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/collection"]["post"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id) {
    return res.sendStatus(400);
  }
  try {
    const collection = await database.collectionFind({ collectionId: body.id });
    if (!collection) {
      return res.sendStatus(404);
    }
    if (collection.owner !== profile.uid && collection.visibility === Visibility.private) {
      return res.sendStatus(403);
    }
    const response: v1.paths["/collection"]["post"]["responses"]["200"]["content"]["application/json"] = {
      id: collection.id,
      name: collection.name,
      visibility: collection.visibility,
      seasons: await Promise.all(
        (
          await Promise.all((collection.seasons ?? []).map(async (seasonId) => await database.seasonFind({ seasonId: seasonId })))
        ).map(async (season) => ({
          ...season,
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
              subtitles: await Promise.all(
                (episode.subtitles ?? []).map(async (subtitleId) => await database.subtitleFind({ subtitleId: subtitleId }))
              )
            }))
          )
        }))
      ),
      owner: collection.owner,
      creationDate: collection.creationDate
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.put("/", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/collection"]["put"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.name) {
    return res.sendStatus(400);
  }
  try {
    const collectionId = uuidv4();
    let thumbnail: File | undefined = undefined;
    if (body.thumbnail) {
      thumbnail = await database.fileFind({ fileId: body.thumbnail });
      if (!thumbnail) {
        return res.sendStatus(404);
      }
      if (thumbnail.owner !== profile.uid) {
        return res.sendStatus(403);
      }
    }
    const collection = await database.collectionCreate({
      id: collectionId,
      name: body.name,
      visibility: body.visibility ?? Visibility.private,
      thumbnail: thumbnail?.id,
      owner: profile.uid
    });
    const response: v1.paths["/collection"]["put"]["responses"]["200"]["content"]["application/json"] = {
      id: collection.id,
      name: collection.name,
      visibility: collection.visibility,
      seasons: await Promise.all(
        (
          await Promise.all((collection.seasons ?? []).map(async (seasonId) => await database.seasonFind({ seasonId: seasonId })))
        ).map(async (season) => ({
          ...season,
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
              subtitles: await Promise.all(
                (episode.subtitles ?? []).map(async (subtitleId) => await database.subtitleFind({ subtitleId: subtitleId }))
              )
            }))
          )
        }))
      ),
      owner: collection.owner,
      creationDate: collection.creationDate
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.patch("/", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/collection"]["patch"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || !(body.name || body.visibility || body.thumbnail)) {
    return res.sendStatus(400);
  }
  try {
    const collection = await database.collectionFind({ collectionId: body.id });
    if (!collection) {
      return res.sendStatus(404);
    }
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    let thumbnail: File | undefined = undefined;
    if (body.thumbnail) {
      thumbnail = await database.fileFind({ fileId: body.thumbnail });
      if (!thumbnail) {
        return res.sendStatus(404);
      }
      if (thumbnail.owner !== profile.uid) {
        return res.sendStatus(403);
      }
    }
    await database.collectionPatch({
      collectionId: body.id,
      name: body.name,
      visibility: body.visibility,
      thumbnail: thumbnail?.id
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.delete("/", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/collection"]["delete"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id) {
    return res.sendStatus(400);
  }
  try {
    const collection = await database.collectionFind({ collectionId: body.id });
    if (!collection) {
      return res.sendStatus(404);
    }
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.collectionDelete({
      collectionId: body.id
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

export default router;

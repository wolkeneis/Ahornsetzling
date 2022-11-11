import express, { Router } from "express";
import type { cdn_api_v1 as v1 } from "moos-api";
import { v4 as uuidv4 } from "uuid";
import { Language, Visibility, type Profile } from "../database/database-adapter.js";
import database from "../database/index.js";
import { signDownloadUrl } from "../files.js";
import { ensureLoggedIn } from "../middleware.js";

const router: Router = express.Router();

router.use(ensureLoggedIn());

router.post("/source", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/source"]["post"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id) {
    return res.sendStatus(400);
  }
  try {
    const source = await database.sourceFind({ sourceId: body.id });
    if (!source) {
      return res.sendStatus(404);
    }
    const season = await database.seasonFind({ seasonId: source.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid && collection.visibility === Visibility.private) {
      return res.sendStatus(403);
    }
    if (!source.key) {
      return res.sendStatus(500);
    }
    const url = await signDownloadUrl({ uid: collection.owner, fileId: source.key as string, filename: source.id }, 43200);
    const response: v1.paths["/source"]["post"]["responses"]["200"]["content"]["application/json"] = {
      url: url
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.put("/source", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/source"]["put"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.seasonId || !body.episodeId || !body.language || !body.key) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    if (!(body.language in Language) || (body.subtitles && !(body.subtitles in Language))) {
      return res.sendStatus(400);
    }
    if (body.key) {
      const fileMetadata = await database.fileFind({ fileId: body.key });
      if (!fileMetadata) {
        return res.sendStatus(404);
      }
      if (fileMetadata.owner !== profile.uid) {
        return res.sendStatus(403);
      }
    }
    const sourceId = uuidv4();
    const source = await database.sourceCreate({
      seasonId: body.seasonId,
      episodeId: body.episodeId,
      id: sourceId,
      language: body.language as Language,
      key: body.key,
      subtitles: body.subtitles as Language
    });
    const response: v1.paths["/source"]["put"]["responses"]["200"]["content"]["application/json"] = {
      seasonId: season.id,
      episodeId: source.episodeId,
      id: source.id,
      language: source.language,
      key: source.key,
      subtitles: source.subtitles ?? undefined,
      creationDate: source.creationDate
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.patch("/source", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/source"]["patch"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || !body.episodeId || !body.seasonId || !(body.language || body.key || body.subtitles)) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    if (body.language && !(body.language in Language)) {
      return res.sendStatus(400);
    }
    if (body.subtitles && !(body.subtitles in Language)) {
      return res.sendStatus(400);
    }
    if (body.key) {
      const fileMetadata = await database.fileFind({ fileId: body.key });
      if (!fileMetadata) {
        return res.sendStatus(404);
      }
      if (fileMetadata.owner !== profile.uid) {
        return res.sendStatus(403);
      }
    }
    await database.sourcePatch({
      seasonId: body.seasonId,
      episodeId: body.episodeId,
      sourceId: body.id,
      language: body.language as Language,
      key: body.key,
      subtitles: body.subtitles as Language
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.delete("/source", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/source"]["delete"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || !body.seasonId || !body.episodeId) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.sourceDelete({
      seasonId: body.seasonId,
      episodeId: body.episodeId,
      sourceId: body.id
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

export default router;

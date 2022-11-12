import express, { Router } from "express";
import type { cdn_api_v1 as v1 } from "moos-api";
import { v4 as uuidv4 } from "uuid";
import { Language, Visibility, type Profile } from "../database/database-adapter.js";
import database from "../database/index.js";
import { signDownloadUrl } from "../files.js";
import { ensureLoggedIn } from "../middleware.js";

const router: Router = express.Router();

router.use(ensureLoggedIn());

router.post("/", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/subtitle"]["post"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id) {
    return res.sendStatus(400);
  }
  try {
    const subtitle = await database.subtitleFind({ subtitleId: body.id });
    if (!subtitle) {
      return res.sendStatus(404);
    }
    const season = await database.seasonFind({ seasonId: subtitle.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid && collection.visibility === Visibility.private) {
      return res.sendStatus(403);
    }
    if (!subtitle.key) {
      return res.sendStatus(500);
    }
    const url = await signDownloadUrl({ uid: collection.owner, fileId: subtitle.key as string, filename: subtitle.id }, 43200);
    const response: v1.paths["/subtitle"]["post"]["responses"]["200"]["content"]["application/json"] = {
      url: url
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.put("/", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/subtitle"]["put"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.seasonId || !body.episodeId || !body.language || !body.key) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    if (!(body.language in Language)) {
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
    const subtitleId = uuidv4();
    const subtitle = await database.subtitleCreate({
      seasonId: body.seasonId,
      episodeId: body.episodeId,
      id: subtitleId,
      language: body.language as Language,
      key: body.key
    });
    const response: v1.paths["/subtitle"]["put"]["responses"]["200"]["content"]["application/json"] = {
      seasonId: season.id,
      episodeId: subtitle.episodeId,
      id: subtitle.id,
      language: subtitle.language,
      key: subtitle.key,
      creationDate: subtitle.creationDate
    };
    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.patch("/", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/subtitle"]["patch"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || !body.episodeId || !body.seasonId || !(body.language || body.key)) {
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
    if (body.key) {
      const fileMetadata = await database.fileFind({ fileId: body.key });
      if (!fileMetadata) {
        return res.sendStatus(404);
      }
      if (fileMetadata.owner !== profile.uid) {
        return res.sendStatus(403);
      }
    }
    await database.subtitlePatch({
      seasonId: body.seasonId,
      episodeId: body.episodeId,
      subtitleId: body.id,
      language: body.language as Language,
      key: body.key
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.delete("/", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.paths["/subtitle"]["delete"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || !body.seasonId || !body.episodeId) {
    return res.sendStatus(400);
  }
  try {
    const season = await database.seasonFind({ seasonId: body.seasonId });
    const collection = await database.collectionFind({ collectionId: season.collectionId });
    if (collection.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.subtitleDelete({
      seasonId: body.seasonId,
      episodeId: body.episodeId,
      subtitleId: body.id
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

export default router;

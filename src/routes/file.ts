import express, { Router } from "express";
import type { cdn_api_v1 as v1 } from "moos-api";
import { v4 as uuidv4 } from "uuid";
import { type Profile } from "../database/database-adapter.js";
import database from "../database/index.js";
import { deleteFile, signDownloadUrl, signUploadUrl } from "../files.js";
import { ensureLoggedIn } from "../middleware.js";

const router: Router = express.Router();

router.use(ensureLoggedIn());

router.post("/file", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.operations["post-profile-file"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id || (body.ttl && (typeof body.ttl !== "number" || body.ttl > 43200 || body.ttl < 60))) {
    return res.sendStatus(400);
  }
  try {
    const fileMetadata = await database.fileFind({ fileId: body.id });
    if (!fileMetadata) {
      return res.sendStatus(404);
    }
    if (fileMetadata.private && fileMetadata.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    const url = await signDownloadUrl({ uid: fileMetadata.owner, fileId: fileMetadata.id, filename: fileMetadata.name }, body.ttl ?? 14400);
    const file: v1.operations["post-profile-file"]["responses"]["200"]["content"]["application/json"] = {
      id: fileMetadata.id,
      url: url,
      ttl: body.ttl ?? 14400
    };
    return res.json(file);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.put("/file", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.operations["put-profile-file"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.name) {
    return res.sendStatus(400);
  }
  try {
    const fileId = uuidv4();
    await database.fileCreate({ id: fileId, name: body.name, owner: profile.uid, private: body.private ?? true });
    const url = await signUploadUrl({ uid: profile.uid, fileId: fileId });
    const file: v1.operations["put-profile-file"]["responses"]["200"]["content"]["application/json"] = {
      id: fileId,
      url: url,
      ttl: 14400
    };
    return res.json(file);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.patch("/file", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.operations["patch-profile-file"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id) {
    return res.sendStatus(400);
  }
  try {
    const fileMetadata = await database.fileFind({ fileId: body.id });
    if (!fileMetadata) {
      return res.sendStatus(404);
    }
    if (fileMetadata.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.filePatch({
      fileId: body.id,
      private: body.private,
      name: body.name
    });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

router.delete("/file", async (req, res) => {
  const profile = req.user as Profile;
  const body: v1.operations["delete-profile-file"]["requestBody"]["content"]["application/json"] = req.body;
  if (!body || !body.id) {
    return res.sendStatus(400);
  }
  try {
    const fileMetadata = await database.fileFind({ fileId: body.id });
    if (!fileMetadata) {
      return res.sendStatus(404);
    }
    if (fileMetadata.owner !== profile.uid) {
      return res.sendStatus(403);
    }
    await database.fileDelete({
      fileId: body.id
    });
    await deleteFile({ uid: fileMetadata.owner, fileId: fileMetadata.id });
    return res.sendStatus(204);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

export default router;

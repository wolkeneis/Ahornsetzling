import express, { Router } from "express";
import type { cdn_api_v1 as v1 } from "moos-api";
import { File, type Profile } from "../database/database-adapter.js";
import database from "../database/index.js";
import { signDownloadUrl } from "../files.js";
import { ensureLoggedIn } from "../middleware.js";

const router: Router = express.Router();

router.use(ensureLoggedIn());

router.post("/collections", async (req, res) => {
  const profile = req.user as Profile;
  try {
    const collections: v1.operations["post-profile-collections"]["responses"]["200"]["content"]["application/json"] = await Promise.all(
      (
        await database.collections(profile.scopes)
      ).map(async (fetchedCollection) => {
        let thumbnail: File | undefined = undefined;
        if (fetchedCollection.thumbnail) {
          thumbnail = await database.fileFind({ fileId: fetchedCollection.thumbnail });
        }
        const collection: v1.CollectionPreview = {
          id: fetchedCollection.id,
          name: fetchedCollection.name,
          visibility: fetchedCollection.visibility,
          thumbnail:
            (thumbnail ? await signDownloadUrl({ uid: thumbnail.owner, fileId: thumbnail.id, filename: thumbnail.name }, 43200) : undefined) ??
            undefined,
          owner: fetchedCollection.owner,
          creationDate: fetchedCollection.creationDate
        };
        return collection;
      })
    );
    return res.json(collections);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

export default router;

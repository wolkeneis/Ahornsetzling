import { JsonDB } from "node-json-db";
import DatabaseAdapter, {
  CreateSubtitleOptions,
  DeleteSubtitleOptions,
  FindSubtitleByIdOptions,
  PatchSubtitleOptiopns,
  Subtitle,
  Visibility,
  type Collection,
  type CreateCollectionOptions,
  type CreateEpisodeOptions,
  type CreateFileOptions,
  type CreateSeasonOptions,
  type CreateSourceOptions,
  type DeleteCollectionOptions,
  type DeleteEpisodeOptions,
  type DeleteFileOptions,
  type DeleteSeasonOptions,
  type DeleteSourceOptions,
  type Episode,
  type File,
  type FindCollectionByIdOptions,
  type FindEpisodeByIdOptions,
  type FindFileByIdOptions,
  type FindSeasonByIdOptions,
  type FindSourceByIdOptions,
  type FindUserByIdOptions,
  type PatchCollectionOptiopns,
  type PatchEpisodeOptiopns,
  type PatchFileOptiopns,
  type PatchSeasonOptiopns,
  type PatchSourceOptiopns,
  type PatchUserOptiopns,
  type Profile,
  type Season,
  type Source
} from "./database-adapter.js";

export default class JsonDatabaseImpl implements DatabaseAdapter {
  private database: JsonDB;

  constructor(database: JsonDB) {
    this.database = database;
  }

  async profileFindById(options: FindUserByIdOptions): Promise<Profile> {
    return await this.database.getObject<Profile>(`/profiles/${options.uid}`);
  }
  async profilePatch(options: PatchUserOptiopns): Promise<void> {
    if (!this.database.exists(`/profiles/${options.uid}`)) {
      options.scopes = ["user"];
    }
    this.database.push(`/profiles/${options.uid}`, options, false);
  }

  async fileFind(options: FindFileByIdOptions): Promise<File> {
    return await this.database.getObject<File>(`/files/${options.fileId}`);
  }
  async fileCreate(options: CreateFileOptions): Promise<void> {
    const file: File = {
      ...options,
      private: options.private ?? true,
      creationDate: Date.now()
    };
    await this.database.push(`/files/${options.id}`, file, false);
  }
  async filePatch(options: PatchFileOptiopns): Promise<void> {
    if (options.name !== undefined) {
      await this.database.push(`/files/${options.fileId}/name`, options.name, false);
    }
    if (options.private !== undefined) {
      await this.database.push(`/files/${options.fileId}/private`, options.private, false);
    }
  }
  async fileDelete(options: DeleteFileOptions): Promise<void> {
    await this.database.delete(`/files/${options.fileId}`);
  }

  async collections(scopes: ("*" | "user" | "admin" | "restricted")[]): Promise<Collection[]> {
    return (
      (await this.database.filter(
        "/collections",
        (entry: Collection) =>
          entry.visibility === Visibility.public ||
          (entry.visibility === Visibility.unlisted && (scopes.includes("restricted") || scopes.includes("admin") || scopes.includes("*"))) ||
          (entry.visibility === Visibility.private && (scopes.includes("admin") || scopes.includes("*")))
      )) ?? []
    );
  }

  async collectionFind(options: FindCollectionByIdOptions): Promise<Collection> {
    return await this.database.getObject<Collection>(`/collections/${options.collectionId}`);
  }
  async collectionCreate(options: CreateCollectionOptions): Promise<Collection> {
    const collection: Collection = {
      ...options,
      thumbnail: options.thumbnail ?? null,
      seasons: [],
      creationDate: Date.now()
    };
    await this.database.push(`/collections/${options.id}`, collection, false);
    return collection;
  }
  async collectionPatch(options: PatchCollectionOptiopns): Promise<void> {
    if (options.name !== undefined) {
      await this.database.push(`/collections/${options.collectionId}/name`, options.name, false);
    }
    if (options.visibility !== undefined) {
      await this.database.push(`/collections/${options.collectionId}/visibility`, options.visibility, false);
    }
    if (options.thumbnail !== undefined) {
      await this.database.push(`/collections/${options.collectionId}/thumbnail`, options.thumbnail, false);
    }
  }
  async collectionDelete(options: DeleteCollectionOptions): Promise<void> {
    const collection = await this.collectionFind({ collectionId: options.collectionId });
    await this.database.delete(`/collections/${options.collectionId}`);
    if (collection.seasons && collection.seasons.length !== 0) {
      collection.seasons.forEach(async (seasonId) => {
        await this.seasonDelete({ seasonId: seasonId });
      });
    }
  }

  async seasonFind(options: FindSeasonByIdOptions): Promise<Season> {
    return await this.database.getObject<Season>(`/seasons/${options.seasonId}`);
  }
  async seasonCreate(options: CreateSeasonOptions): Promise<Season> {
    const season: Season = {
      ...options,
      episodes: [],
      languages: [],
      subtitles: []
    };
    await this.database.push(`/seasons/${options.id}`, season, false);
    const seasons = ((await this.collectionFind({ collectionId: options.collectionId })).seasons ?? []).concat(season.id);
    await this.database.push(`/collections/${options.id}/seasons`, seasons, false);
    return season;
  }
  async seasonPatch(options: PatchSeasonOptiopns): Promise<void> {
    if (options.index !== undefined) {
      await this.database.push(`/seasons/${options.seasonId}/index`, options.index, false);
    }
  }
  async seasonDelete(options: DeleteSeasonOptions): Promise<void> {
    const season = await this.seasonFind({ seasonId: options.seasonId });
    await this.database.delete(`/seasons/${options.seasonId}`);
    const collection = await this.collectionFind({ collectionId: season.collectionId });
    collection.seasons = (collection.seasons ?? []).filter((seasonId) => seasonId !== season.id);
    await this.database.push(`/collections/${options.seasonId}/seasons`, collection.seasons, false);
    if (season.episodes && season.episodes.length !== 0) {
      season.episodes.forEach(async (episodeId) => {
        await this.episodeDelete({ seasonId: season.id, episodeId: episodeId });
      });
    }
  }

  async episodeFind(options: FindEpisodeByIdOptions): Promise<Episode> {
    return await this.database.getObject<Episode>(`/episodes/${options.seasonId}/${options.episodeId}`);
  }
  async episodeCreate(options: CreateEpisodeOptions): Promise<Episode> {
    const episode: Episode = {
      ...options,
      sources: [],
      subtitles: [],
      creationDate: Date.now()
    };
    await this.database.push(`/episodes/${options.seasonId}/${options.id}`, episode, false);
    const episodes = ((await this.seasonFind({ seasonId: options.seasonId })).episodes ?? []).concat(episode.id);
    await this.database.push(`/seasons/${options.seasonId}/episodes`, episodes, false);
    return episode;
  }
  async episodePatch(options: PatchEpisodeOptiopns): Promise<void> {
    if (options.index !== undefined) {
      await this.database.push(`/episodes/${options.seasonId}/${options.episodeId}/index`, options.index, false);
    }
    if (options.name !== undefined) {
      await this.database.push(`/episodes/${options.seasonId}/${options.episodeId}/name`, options.name, false);
    }
  }
  async episodeDelete(options: DeleteEpisodeOptions): Promise<void> {
    const episode = await this.episodeFind({ seasonId: options.seasonId, episodeId: options.episodeId });
    await this.database.delete(`/episodes/${options.seasonId}/${options.episodeId}`);
    const season = await this.seasonFind({ seasonId: options.seasonId });
    season.episodes = (season.episodes ?? []).filter((episodeId) => episodeId !== episode.id);
    await this.database.push(`/seasons/${options.seasonId}/episodes`, season.episodes);
    if (episode.sources && episode.sources.length !== 0) {
      episode.sources.forEach(async (sourceId) => {
        await this.sourceDelete({ seasonId: season.id, episodeId: episode.id, sourceId: sourceId });
      });
    }
  }

  async sourceFind(options: FindSourceByIdOptions): Promise<Source> {
    return await this.database.getObject<Source>(`/sources/${options.sourceId}`);
  }
  async sourceCreate(options: CreateSourceOptions): Promise<Source> {
    const source: Source = {
      ...options,
      key: options.key,
      subtitles: options.subtitles ?? null,
      creationDate: Date.now()
    };
    await this.database.push(`/sources/${options.id}`, source, false);
    const sources = ((await this.episodeFind({ seasonId: options.seasonId, episodeId: options.episodeId })).sources ?? []).concat(source.id);
    await this.database.push(`/episodes/${options.seasonId}/${options.episodeId}/sources`, sources);
    await this.updateLanguages({ seasonId: options.seasonId });
    await this.updateSubtitles({ seasonId: options.seasonId });
    return source;
  }
  async sourcePatch(options: PatchSourceOptiopns): Promise<void> {
    if (options.language !== undefined) {
      await this.database.push(`/sources/${options.sourceId}/language`, options.language);
    }
    if (options.key !== undefined) {
      await this.database.push(`/sources/${options.sourceId}/key`, options.key);
    }
    if (options.subtitles !== undefined) {
      await this.database.push(`/sources/${options.sourceId}/subtitles`, options.subtitles);
    }
    if (options.language || options.subtitles) {
      await this.updateLanguages({ seasonId: options.seasonId });
      await this.updateSubtitles({ seasonId: options.seasonId });
    }
  }
  async sourceDelete(options: DeleteSourceOptions): Promise<void> {
    const source = await this.sourceFind({ sourceId: options.sourceId });
    await this.database.delete(`/sources/${options.sourceId}`);
    const episode = await this.episodeFind({ seasonId: options.seasonId, episodeId: options.episodeId });
    episode.sources = (episode.sources ?? []).filter((sourceId) => sourceId !== source.id);
    await this.database.push(`/episodes/${options.seasonId}/${options.episodeId}/sources`, episode.sources);
    await this.updateLanguages({ seasonId: options.seasonId });
    await this.updateSubtitles({ seasonId: options.seasonId });
  }

  async subtitleFind(options: FindSubtitleByIdOptions): Promise<Subtitle> {
    return await this.database.getObject<Subtitle>(`/subtitles/${options.subtitleId}`);
  }
  async subtitleCreate(options: CreateSubtitleOptions): Promise<Subtitle> {
    const subtitle: Subtitle = {
      ...options,
      key: options.key,
      creationDate: Date.now()
    };
    await this.database.push(`/subtitles/${options.id}`, subtitle, false);
    const subtitles = ((await this.episodeFind({ seasonId: options.seasonId, episodeId: options.episodeId })).subtitles ?? []).concat(subtitle.id);
    await this.database.push(`/episodes/${options.seasonId}/${options.episodeId}/subtitles`, subtitles);
    await this.updateLanguages({ seasonId: options.seasonId });
    await this.updateSubtitles({ seasonId: options.seasonId });
    return subtitle;
  }
  async subtitlePatch(options: PatchSubtitleOptiopns): Promise<void> {
    if (options.language !== undefined) {
      await this.database.push(`/subtitles/${options.subtitleId}/language`, options.language);
    }
    if (options.key !== undefined) {
      await this.database.push(`/subtitles/${options.subtitleId}/key`, options.key);
    }
    if (options.language) {
      await this.updateSubtitles({ seasonId: options.seasonId });
    }
  }
  async subtitleDelete(options: DeleteSubtitleOptions): Promise<void> {
    const subtitle = await this.subtitleFind({ subtitleId: options.subtitleId });
    await this.database.delete(`/subtitles/${options.subtitleId}`);
    const episode = await this.episodeFind({ seasonId: options.seasonId, episodeId: options.episodeId });
    episode.subtitles = (episode.subtitles ?? []).filter((subtitleId) => subtitleId !== subtitle.id);
    await this.database.push(`/episodes/${options.seasonId}/${options.episodeId}/subtitles`, episode.subtitles);
    await this.updateLanguages({ seasonId: options.seasonId });
    await this.updateSubtitles({ seasonId: options.seasonId });
  }

  private async updateLanguages(options: { seasonId: string }) {
    const season = await this.seasonFind({ seasonId: options.seasonId });

    const languages = (
      await Promise.all(
        season.episodes.map(
          async (episodeId) =>
            await Promise.all(
              ((await this.episodeFind({ seasonId: season.id, episodeId: episodeId })).sources ?? []).map(
                async (sourceId) => (await this.sourceFind({ sourceId: sourceId })).language
              )
            )
        )
      )
    ).flat();
    await this.database.push(`/seasons/${season.id}/languages`, [...new Set(languages)]);
  }

  private async updateSubtitles(options: { seasonId: string }) {
    const season = await this.seasonFind({ seasonId: options.seasonId });
    const embededSubtitles = (
      await Promise.all(
        season.episodes.map(
          async (episodeId) =>
            await Promise.all(
              ((await this.episodeFind({ seasonId: season.id, episodeId: episodeId })).sources ?? []).map(
                async (sourceId) => (await this.sourceFind({ sourceId: sourceId })).subtitles
              )
            )
        )
      )
    )
      .flat()
      .filter((subtitles) => !!subtitles);
    const subtitles = (
      await Promise.all(
        season.episodes.map(
          async (episodeId) =>
            await Promise.all(
              ((await this.episodeFind({ seasonId: season.id, episodeId: episodeId })).subtitles ?? []).map(
                async (subtitleId) => (await this.subtitleFind({ subtitleId: subtitleId })).language
              )
            )
        )
      )
    )
      .flat()
      .filter((subtitles) => !!subtitles);
    await this.database.push(`/seasons/${season.id}/subtitles`, [...new Set(embededSubtitles), ...new Set(subtitles)]);
  }
}

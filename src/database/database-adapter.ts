export type ApplicationSecret = string;

export type CheckResult = boolean;
export type CollectionList = string[];

export enum Language {
  en_EN = "en_EN",
  de_DE = "de_DE",
  ja_JP = "ja_JP",
  zh_CN = "zh_CN"
}

export const enum Visibility {
  public = "public",
  private = "private",
  unlisted = "unlisted"
}

export type Profile = {
  uid: string;
  username: string;
  avatar: string | null;
  scopes: ("*" | "user" | "admin" | "restricted")[];
  creationDate: number;
};

export type File = {
  id: string;
  name: string;
  owner: string;
  private: boolean;
  creationDate: number;
};

export type Collection = {
  id: string;
  name: string;
  visibility: "public" | "private" | "unlisted";
  seasons: string[];
  thumbnail: string | null;
  owner: string;
  creationDate: number;
};

export type Season = {
  collectionId: string;
  id: string;
  index: number;
  episodes: string[];
  languages: Language[];
  subtitles: Language[];
};

export type Episode = {
  seasonId: string;
  id: string;
  index: number;
  name: string;
  sources: string[];
  subtitles: string[];
  creationDate: number;
};

export type Source = {
  seasonId: string;
  episodeId: string;
  id: string;
  language: Language;
  key: string;
  subtitles: Language | null;
  creationDate: number;
};

export type Subtitle = {
  seasonId: string;
  episodeId: string;
  id: string;
  language: Language;
  key: string;
  creationDate: number;
};

export default interface DatabaseAdapter {
  profileFindById(options: FindUserByIdOptions): Promise<Profile>;
  profilePatch(options: PatchUserOptiopns): Promise<void>;

  fileFind(options: FindFileByIdOptions): Promise<File>;
  fileCreate(options: CreateFileOptions): Promise<void>;
  filePatch(options: PatchFileOptiopns): Promise<void>;
  fileDelete(options: DeleteFileOptions): Promise<void>;

  collections(options: CollectionsOptions): Promise<CollectionList>;

  collectionFind(options: FindCollectionByIdOptions): Promise<Collection>;
  collectionCreate(options: CreateCollectionOptions): Promise<Collection>;
  collectionPatch(options: PatchCollectionOptiopns): Promise<void>;
  collectionDelete(options: DeleteCollectionOptions): Promise<void>;

  seasonFind(options: FindSeasonByIdOptions): Promise<Season>;
  seasonCreate(options: CreateSeasonOptions): Promise<Season>;
  seasonPatch(options: PatchSeasonOptiopns): Promise<void>;
  seasonDelete(options: DeleteSeasonOptions): Promise<void>;

  episodeFind(options: FindEpisodeByIdOptions): Promise<Episode>;
  episodeCreate(options: CreateEpisodeOptions): Promise<Episode>;
  episodePatch(options: PatchEpisodeOptiopns): Promise<void>;
  episodeDelete(options: DeleteEpisodeOptions): Promise<void>;

  sourceFind(options: FindSourceByIdOptions): Promise<Source>;
  sourceCreate(options: CreateSourceOptions): Promise<Source>;
  sourcePatch(options: PatchSourceOptiopns): Promise<void>;
  sourceDelete(options: DeleteSourceOptions): Promise<void>;

  subtitleFind(options: FindSubtitleByIdOptions): Promise<Subtitle>;
  subtitleCreate(options: CreateSubtitleOptions): Promise<Subtitle>;
  subtitlePatch(options: PatchSubtitleOptiopns): Promise<void>;
  subtitleDelete(options: DeleteSubtitleOptions): Promise<void>;
}

export type FindFileByIdOptions = {
  fileId: string;
};

export type CreateFileOptions = {
  id: string;
  name: string;
  owner: string;
  private?: boolean;
};

export type PatchFileOptiopns = {
  fileId: string;
  name?: string;
  private?: boolean;
};

export type DeleteFileOptions = {
  fileId: string;
};

export type CollectionsOptions = ("*" | "user" | "admin" | "restricted")[];

export type FindCollectionByIdOptions = {
  collectionId: string;
};

export type CreateCollectionOptions = {
  id: string;
  name: string;
  visibility: "public" | "private" | "unlisted";
  thumbnail?: string;
  owner: string;
};

export type PatchCollectionOptiopns = {
  collectionId: string;
  name?: string;
  visibility?: "public" | "private" | "unlisted";
  thumbnail?: string;
};

export type DeleteCollectionOptions = {
  collectionId: string;
};

export type FindSeasonByIdOptions = {
  seasonId: string;
};

export type CreateSeasonOptions = {
  collectionId: string;
  id: string;
  index: number;
};

export type PatchSeasonOptiopns = {
  seasonId: string;
  index: number;
};

export type DeleteSeasonOptions = {
  seasonId: string;
};

export type FindEpisodeByIdOptions = {
  seasonId: string;
  episodeId: string;
};

export type CreateEpisodeOptions = {
  seasonId: string;
  id: string;
  index: number;
  name: string;
};

export type PatchEpisodeOptiopns = {
  seasonId: string;
  episodeId: string;
  index?: number;
  name?: string;
};

export type DeleteEpisodeOptions = {
  seasonId: string;
  episodeId: string;
};

export type FindSourceByIdOptions = {
  sourceId: string;
};

export type CreateSourceOptions = {
  seasonId: string;
  episodeId: string;
  id: string;
  language: Language;
  key: string;
  subtitles?: Language;
};

export type PatchSourceOptiopns = {
  seasonId: string;
  episodeId: string;
  sourceId: string;
  language?: Language;
  key?: string;
  subtitles?: Language;
};

export type DeleteSourceOptions = {
  seasonId: string;
  episodeId: string;
  sourceId: string;
};

export type FindSubtitleByIdOptions = {
  subtitleId: string;
};

export type CreateSubtitleOptions = {
  seasonId: string;
  episodeId: string;
  id: string;
  language: Language;
  key: string;
};

export type PatchSubtitleOptiopns = {
  seasonId: string;
  episodeId: string;
  subtitleId: string;
  language?: Language;
  key?: string;
};

export type DeleteSubtitleOptions = {
  seasonId: string;
  episodeId: string;
  subtitleId: string;
};

export type FindUserByIdOptions = {
  uid: string;
};

export type PatchUserOptiopns = {
  uid: string;
  username: string;
  avatar: string | null;
  scopes?: ("*" | "user" | "admin" | "restricted")[];
  creationDate: number;
};

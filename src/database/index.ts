import { Config, JsonDB } from "node-json-db";
import { env } from "../environment.js";
import type DatabaseAdapterInterface from "./database-adapter.js";
import JsonDatabaseImpl from "./json-database.js";

const defaultImpl: DatabaseAdapterInterface = new JsonDatabaseImpl(
  new JsonDB(new Config(env("DATABASE_PATH") ?? "security/database.json", true, true, "/", true))
);

export default defaultImpl;
export type DatabaseAdapter = DatabaseAdapterInterface;

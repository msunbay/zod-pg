import { Client } from "pg";
import { ensureEnvVar } from "./utils";

export const createClient = () => {
  if (process.env.POSTGRES_CONNECTION_STRING) {
    return new Client({
      connectionString: process.env.POSTGRES_CONNECTION_STRING,
      application_name: "zod-pg",
    });
  }

  return new Client({
    password: ensureEnvVar("POSTGRES_PASSWORD"),
    user: ensureEnvVar("POSTGRES_USER"),
    database: ensureEnvVar("POSTGRES_DB"),
    host: ensureEnvVar("POSTGRES_HOST"),
    ssl: process.env.POSTGRES_PORT === "true",
    port: parseInt(process.env.POSTGRES_PORT ?? "5432", 10),
    application_name: "zod-pg",
  });
};

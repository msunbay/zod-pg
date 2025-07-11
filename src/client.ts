import { Client } from "pg";

export const createClient = ({
  connectionString,
  ssl = false,
}: {
  ssl: boolean;
  connectionString?: string;
}) => {
  return new Client({
    connectionString,
    ssl,
    application_name: "zod-pg",
  });
};

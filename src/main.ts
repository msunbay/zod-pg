import { writeFileSync } from "fs";
import { Client } from "pg";

import { generateTableSchema } from "./generateTableSchema";
import { clearTablesDirectory, ensureEnvVar, sql, toError } from "./utils";
import { program } from "commander";
import { createClient } from "./client";
import { generateTablesIndexFile } from "./generateIndexFile";
import { generateTypesFile } from "./generateTypesFile";
import { generateConstantsFile } from "./generateConstantsFile";

/**
 * Main entrypoint: connects to Postgres, cleans output, generates Zod schemas for all tables, and writes an index file.
 */
export const main = async () => {
  program.name("zod-pg");
  program.description("Generates Zod schemas from PostgreSQL database tables.");
  program.requiredOption(
    "-o,--output <path>",
    "Output directory for generated schemas"
  );

  program.option("--exclude <regex>", "Exclude tables matching this regex");
  program.option(
    "--include <regex>",
    "Include only tables matching this regex"
  );
  program.option("--schema <name>", "Specify schema name (default: public)");
  program.option(
    "--json-schema-import-location <path>",
    "Path to import JSON schemas"
  );

  program.option("--connection-string <string>", "Postgres connection string");

  program.option(
    "--password <string>",
    "Postgres password",
    process.env.POSTGRES_PASSWORD
  );
  program.option("--user <string>", "Postgres user", process.env.POSTGRES_USER);
  program.option(
    "--database <string>",
    "Postgres database",
    process.env.POSTGRES_DB
  );
  program.option("--host <string>", "Postgres host", process.env.POSTGRES_HOST);
  program.option(
    "--ssl",
    "Use SSL for Postgres connection",
    process.env.POSTGRES_SSL === "true"
  );
  program.option(
    "--port <number>",
    "Postgres port",
    process.env.POSTGRES_PORT || "5432"
  );

  program.parse();

  const options = program.opts();
  const outputPath = options.output;
  const excludeRegex = options.exclude ? new RegExp(options.exclude) : null;
  const includeRegex = options.include ? new RegExp(options.include) : null;
  const schemaName = options.schema || "public";
  const jsonSchemaImportLocation = options.jsonSchemaImportLocation;

  let connectionString = options.connectionString;
  const ssl = options.ssl;

  if (!connectionString) {
    const { user, password, host, port, database } = options;

    connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  // Mask password in connection string for logging
  const maskedConnectionString = connectionString.replace(
    /(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/,
    "$1****$2"
  );

  console.log(`Using connection string: "${maskedConnectionString}"`);

  clearTablesDirectory(outputPath);

  let client: Client | undefined = undefined;

  try {
    client = createClient({ connectionString, ssl });

    console.log(`Connecting to ${client.host}:${client.port}`);
    await client.connect();
    console.log(`Connected`);

    // Get all user tables in the public schema
    const tablesRes = await client.query(
      sql`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_type = 'BASE TABLE' 
      ORDER BY table_name;`,
      [schemaName]
    );

    const tableNames = tablesRes.rows.map(
      (row: { table_name: string }) => row.table_name
    );

    let includedTables = tableNames.filter(
      (name) => !includeRegex || includeRegex.test(name)
    );

    includedTables = includedTables.filter(
      (name) => !excludeRegex || !excludeRegex.test(name)
    );

    if (includedTables.length === 0) {
      console.error("No tables found to generate schemas for.");
      process.exit(1);
    }

    for (const tableName of includedTables) {
      console.log(`Generating schema for table: ${tableName}`);
      await generateTableSchema({
        client,
        schemaName,
        tableName,
        outputPath,
        jsonSchemaImportLocation,
      });
    }

    await generateTablesIndexFile(outputPath, includedTables);
    await generateConstantsFile(outputPath, includedTables);
    await generateTypesFile(outputPath, includedTables);
  } catch (error) {
    console.error(`Error generating schemas: ${toError(error).message}`);
    process.exit(1);
  } finally {
    await client?.end();
  }
};

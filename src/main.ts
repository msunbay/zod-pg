import { writeFileSync } from "fs";
import { Client } from "pg";

import { generateTableSchema } from "./generateTableSchema";
import { clearTablesDirectory, ensureEnvVar, sql, toError } from "./utils";
import { program } from "commander";
import { createClient } from "./client";
import { generateTablesIndexFile } from "./generateIndexFile";
import { generateConstantsFile, generateTypesFile } from "./generateTypesFile";

/**
 * Main entrypoint: connects to Postgres, cleans output, generates Zod schemas for all tables, and writes an index file.
 */
export const main = async () => {
  program.name("zodium");
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

  program.parse();

  const options = program.opts();
  const outputPath = options.output;
  const excludeRegex = options.exclude ? new RegExp(options.exclude) : null;
  const includeRegex = options.include ? new RegExp(options.include) : null;
  const schemaName = options.schema || "public";
  const jsonSchemaImportLocation = options.jsonSchemaImportLocation;

  clearTablesDirectory(outputPath);

  let client: Client | undefined = undefined;

  try {
    client = createClient();

    console.log(`Connecting to Postgres at ${client.host}`);
    await client.connect();

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

import { writeFileSync } from "fs";
import { Client } from "pg";

import { generateTableSchema } from "./generateTableSchema";
import { clearOutputDirectory, ensureEnvVar, sql, toError } from "./utils";
import { program } from "commander";
import { createClient } from "./client";

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
  program.option("--schema <name>", "Specify schema name (default: public)");

  program.parse();

  const options = program.opts();
  const outputPath = options.output;
  const excludeRegex = options.exclude ? new RegExp(options.exclude) : null;
  const schemaName = options.schema || "public";

  clearOutputDirectory(outputPath);

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

    const includedTables = tableNames.filter(
      (name) => !excludeRegex || !excludeRegex.test(name)
    );

    for (const tableName of includedTables) {
      console.log(`Generating schema for table: ${tableName}`);
      await generateTableSchema({ client, schemaName, tableName, outputPath });
    }

    // generate index file
    const indexContent = includedTables
      .map((name) => `export * from './${name}';`)
      .join("\n");

    const indexFilePath = `${outputPath}/index.ts`;
    writeFileSync(indexFilePath, indexContent);
    console.log(`Generated index file at ${indexFilePath}`);
  } catch (error) {
    console.error(`Error generating schemas: ${toError(error).message}`);
    process.exit(1);
  } finally {
    await client?.end();
  }
};

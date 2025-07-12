import { Client } from 'pg';

import { createClient } from './client';
import { generateConstantsFile } from './generateConstantsFile';
import { generateTablesIndexFile } from './generateIndexFile';
import { generateTableSchema } from './generateTableSchema';
import { generateTypesFile } from './generateTypesFile';
import { clearTablesDirectory, sql, toError } from './utils';

interface GenerateSchemasOptions {
  connectionString: string;
  outputDir: string;
  schemaName?: string;
  includeRegex?: RegExp;
  excludeRegex?: RegExp;
  jsonSchemaImportLocation?: string;
  ssl?: boolean;
}

export const generateSchemas = async ({
  connectionString,
  outputDir,
  schemaName = 'public',
  includeRegex,
  excludeRegex,
  jsonSchemaImportLocation,
  ssl = false,
}: GenerateSchemasOptions) => {
  clearTablesDirectory(outputDir);

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
      console.error('No tables found to generate schemas for.');
      process.exit(1);
    }

    for (const tableName of includedTables) {
      console.log(`Generating schema for table: ${tableName}`);
      await generateTableSchema({
        client,
        schemaName,
        tableName,
        outputDir,
        jsonSchemaImportLocation,
      });
    }

    await generateTablesIndexFile(outputDir, includedTables);
    await generateConstantsFile(outputDir, includedTables);
    await generateTypesFile(outputDir, includedTables);
  } catch (error) {
    console.error(`Error generating schemas: ${toError(error).message}`);
    process.exit(1);
  } finally {
    await client?.end();
  }
};

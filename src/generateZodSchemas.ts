import { Client } from 'pg';

import { createClient } from './database/client';
import { getSchemaInformation } from './database/schema';
import { generateConstantsFile } from './generate/generateConstantsFile';
import { generateTablesIndexFile } from './generate/generateIndexFile';
import { generateTableSchema } from './generate/generateTableSchema';
import { generateTypesFile } from './generate/generateTypesFile';
import {
  clearTablesDirectory,
  ensureOutputDirectories,
  logDebug,
  logError,
  logSuccess,
  toError,
} from './utils';

export interface GenerateZodSchemasOptions {
  connectionString: string;
  outputDir: string;
  cleanOutput?: boolean;
  schemaName?: string;
  includeRegex?: RegExp;
  excludeRegex?: RegExp;
  jsonSchemaImportLocation?: string;
  ssl?: boolean;
}

/**
 * Generates Zod schemas for all tables in the specified Postgres database schema.
 */
export const generateZodSchemas = async ({
  connectionString,
  outputDir,
  cleanOutput = false,
  schemaName = 'public',
  includeRegex,
  excludeRegex,
  jsonSchemaImportLocation,
  ssl = false,
}: GenerateZodSchemasOptions) => {
  ensureOutputDirectories(outputDir);

  if (cleanOutput) {
    clearTablesDirectory(outputDir);
  }

  let client: Client | undefined = undefined;

  try {
    client = createClient({ connectionString, ssl });

    logDebug(`Connecting to Postgres database at ${connectionString}`);
    await client.connect();
    logDebug(`Connected to Postgres database`);

    const schema = await getSchemaInformation(client, {
      schemaName,
      includeRegex,
      excludeRegex,
    });

    logDebug(
      `Generating zod schemas for ${schema.tables.length} tables in db schema '${schemaName}'`
    );

    if (schema.tables.length === 0) {
      logError('No tables found to generate schemas for.');
      process.exit(1);
    }

    for (const table of schema.tables) {
      logDebug(`Generating schema for table: ${table.name}`);

      await generateTableSchema({ table, outputDir, jsonSchemaImportLocation });

      logDebug(`Generated ${outputDir}/tables/${table.name}.ts file`);
    }

    await generateTablesIndexFile(outputDir, schema);
    logDebug(`Generated 'tables/index.ts' file`);

    await generateConstantsFile(outputDir, schema);
    logDebug(`Generated 'constants.ts' file`);

    await generateTypesFile(outputDir, schema);
    logDebug(`Generated 'types.ts' file`);

    logSuccess(`Generated ${schema.tables.length} zod schemas successfully!`);
  } catch (error) {
    logError(`${toError(error).message}`);
    logDebug(error);
    process.exit(1);
  } finally {
    await client?.end();
  }
};

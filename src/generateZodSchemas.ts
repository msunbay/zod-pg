import type { ZodPgConfig, ZodPgSchemaInfo } from './types.js';

import { DEFAULT_CONFIGURATION } from './config.js';
import { PostgreSqlConnector } from './database/PostgreSqlConnector.js';
import { generateConstantsFile } from './generate/generateConstantsFile.js';
import { generateIndexFiles } from './generate/generateIndexFiles.js';
import { generateSchemaFiles } from './generate/generateSchemaFile.js';
import { generateTypesFile } from './generate/generateTypesFile.js';
import { clearTablesDirectory, logDebug } from './utils/index.js';

/**
 * Generates Zod schemas for all tables in the specified database schema.
 */
export const generateZodSchemas = async (
  config: ZodPgConfig
): Promise<ZodPgSchemaInfo> => {
  const generateConfig = {
    ...DEFAULT_CONFIGURATION,
    ...config,
  };

  const { connectionString, outputDir, schemaName, cleanOutput, onProgress } =
    generateConfig;

  if (cleanOutput) {
    clearTablesDirectory(outputDir);
  }

  logDebug(`Connecting to Postgres database at ${connectionString}`);

  const connector = config.dbConnector ?? new PostgreSqlConnector(config);

  const schema = await connector.getSchemaInformation(config);

  onProgress?.('generating', { total: schema.tables.length });

  logDebug(
    `Generating zod schemas for ${schema.tables.length} tables in db schema '${schemaName}'`
  );

  for (const table of schema.tables) {
    await generateSchemaFiles(table, generateConfig);
  }

  await generateIndexFiles(schema, generateConfig);
  await generateConstantsFile(schema, generateConfig);
  await generateTypesFile(schema, generateConfig);

  onProgress?.('done');

  return schema;
};

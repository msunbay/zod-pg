import type { ZodPgConfig, ZodPgProgress, ZodPgSchemaInfo } from './types.js';

import { PostgreSqlConnector } from './database/PostgreSqlConnector.js';
import { generateConstantsFile } from './generate/generateConstantsFile.js';
import { generateIndexFiles } from './generate/generateIndexFiles.js';
import { generateSchemaFiles } from './generate/generateSchemaFile.js';
import { generateTypesFile } from './generate/generateTypesFile.js';
import { clearTablesDirectory, logDebug } from './utils/index.js';

export interface ZodPgGenerateConfig extends ZodPgConfig {
  onProgress?: (status: ZodPgProgress, args?: unknown) => void;
}

const defaultConfig = {
  zodVersion: '3',
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
  moduleResolution: 'commonjs',
} satisfies Partial<ZodPgGenerateConfig>;

/**
 * Generates Zod schemas for all tables in the specified Postgres database schema.
 */
export const generateZodSchemas = async ({
  onProgress,
  ...config
}: ZodPgGenerateConfig): Promise<ZodPgSchemaInfo> => {
  const generateConfig = {
    ...defaultConfig,
    ...config,
  };

  const { connection, outputDir, schemaName, cleanOutput } = generateConfig;

  if (cleanOutput) {
    clearTablesDirectory(outputDir);
  }

  logDebug(`Connecting to Postgres database at ${connection.connectionString}`);

  const connector = config.dbConnector ?? new PostgreSqlConnector(config);

  onProgress?.('connecting');
  onProgress?.('fetchingSchema');
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

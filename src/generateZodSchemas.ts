import { Client } from 'pg';

import type { ZodPgParsedConfig, ZodPgProgress } from './types.js';

import { createClient } from './database/client.js';
import { getSchemaInformation } from './database/schema.js';
import { SchemaInfo } from './database/types.js';
import { generateConstantsFile } from './generate/generateConstantsFile.js';
import { generateTablesIndexFile } from './generate/generateIndexFile.js';
import { generateTableSchema } from './generate/generateTableSchema.js';
import { generateTypesFile } from './generate/generateTypesFile.js';
import {
  clearTablesDirectory,
  ensureOutputDirectories,
  logDebug,
} from './utils/index.js';

export interface ZodPgGenerateConfig extends ZodPgParsedConfig {
  onProgress?: (status: ZodPgProgress) => void;
}

/**
 * Generates Zod schemas for all tables in the specified Postgres database schema.
 */
export const generateZodSchemas = async ({
  onProgress,
  ...config
}: ZodPgGenerateConfig): Promise<SchemaInfo> => {
  const {
    connection,
    outputDir,
    schemaName,
    includeRegex,
    excludeRegex,
    cleanOutput,
  } = config;

  ensureOutputDirectories(outputDir);

  if (cleanOutput) {
    clearTablesDirectory(outputDir);
  }

  let client: Client | undefined = undefined;

  try {
    client = createClient(connection);

    onProgress?.('connecting');

    await client.connect();
    logDebug(`Connected to Postgres database`);

    onProgress?.('fetchingSchema');
    const schema = await getSchemaInformation(client, {
      schemaName,
      includeRegex,
      excludeRegex,
    });

    onProgress?.('generating');

    logDebug(
      `Generating zod schemas for ${schema.tables.length} tables in db schema '${schemaName}'`
    );

    for (const table of schema.tables) {
      logDebug(`Generating schema for table: ${table.name}`);

      await generateTableSchema(table, config);

      logDebug(`Generated ${outputDir}/tables/${table.name}.ts file`);
    }

    await generateTablesIndexFile(schema, config);
    logDebug(`Generated 'tables/index.ts' file`);

    await generateConstantsFile(schema, config);
    logDebug(`Generated 'constants.ts' file`);

    await generateTypesFile(schema, config);
    logDebug(`Generated 'types.ts' file`);

    onProgress?.('done');

    return schema;
  } finally {
    await client?.end();
  }
};

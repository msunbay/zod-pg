import { Client } from 'pg';

import type { ZodPgSchemaInfo } from './database/types.js';
import type { ZodPgConfig, ZodPgProgress } from './types.js';

import { createClient } from './database/client.js';
import { getSchemaInformation } from './database/schema.js';
import { generateConstantsFile } from './generate/generateConstantsFile.js';
import { generateTablesIndexFile } from './generate/generateIndexFile.js';
import { generateTableSchema } from './generate/generateTableSchemaFile.js';
import { generateTypesFile } from './generate/generateTypesFile.js';
import {
  clearTablesDirectory,
  ensureOutputDirectories,
  logDebug,
} from './utils/index.js';

export interface ZodPgGenerateConfig extends ZodPgConfig {
  outputDir: string;
  onProgress?: (status: ZodPgProgress) => void;
}

const defaultConfig = {
  defaultEmptyArray: false,
  stringifyJson: true,
  zodVersion: 3,
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
  outputModule: 'commonjs',
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

  const { connection, outputDir, schemaName, include, exclude, cleanOutput } =
    generateConfig;

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
      include,
      exclude,
    });

    onProgress?.('generating');

    logDebug(
      `Generating zod schemas for ${schema.tables.length} tables in db schema '${schemaName}'`
    );

    for (const tableInfo of schema.tables) {
      logDebug(`Generating schema for table: ${tableInfo.name}`);

      await generateTableSchema(tableInfo, generateConfig);

      logDebug(`Generated ${outputDir}/tables/${tableInfo.name}.ts file`);
    }

    await generateTablesIndexFile(schema, generateConfig);
    logDebug(`Generated 'tables/index.ts' file`);

    await generateConstantsFile(schema, generateConfig);
    logDebug(`Generated 'constants.ts' file`);

    await generateTypesFile(schema, generateConfig);
    logDebug(`Generated 'types.ts' file`);

    onProgress?.('done');

    return schema;
  } finally {
    await client?.end();
  }
};

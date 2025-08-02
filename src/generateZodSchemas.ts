import { Client } from 'pg';

import type { ZodPgConfig, ZodPgProgress, ZodPgSchemaInfo } from './types.js';

import { createClient } from './database/client.js';
import { getSchemaInformation } from './database/schema.js';
import { generateConstantsFile } from './generate/generateConstantsFile.js';
import { generateIndexFiles } from './generate/generateIndexFiles.js';
import { generateSchemaFile } from './generate/generateSchemaFile.js';
import { generateTypesFile } from './generate/generateTypesFile.js';
import { clearTablesDirectory, logDebug } from './utils/index.js';

export interface ZodPgGenerateConfig extends ZodPgConfig {
  outputDir: string;
  onProgress?: (status: ZodPgProgress, args?: unknown) => void;
}

const defaultConfig = {
  defaultEmptyArray: false,
  stringifyJson: true,
  zodVersion: 3,
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

  const { connection, outputDir, schemaName, include, exclude, cleanOutput } =
    generateConfig;

  if (cleanOutput) {
    clearTablesDirectory(outputDir);
  }

  let client: Client | undefined = undefined;

  try {
    logDebug(
      `Connecting to Postgres database at ${connection.connectionString}`
    );

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

    onProgress?.('generating', { total: schema.tables.length });

    logDebug(
      `Generating zod schemas for ${schema.tables.length} tables in db schema '${schemaName}'`
    );

    for (const tableInfo of schema.tables) {
      await generateSchemaFile(tableInfo, generateConfig);
    }

    await generateIndexFiles(schema, generateConfig);
    await generateConstantsFile(schema, generateConfig);
    await generateTypesFile(schema, generateConfig);

    onProgress?.('done');

    return schema;
  } finally {
    await client?.end();
  }
};

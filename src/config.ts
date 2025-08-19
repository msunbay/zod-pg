import { cosmiconfig } from 'cosmiconfig';

import type { ZodPgConfig, ZodPgConnectionConfig } from './types.js';

// Base defaults independent of environment.
const baseDefaults: ZodPgConnectionConfig = {
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
  port: '5432',
  ssl: false,
};

const baseConfig: ZodPgConfig = {
  connection: baseDefaults,
  schemaName: 'public',
  outputDir: './zod-schemas',
};

// Build an overrides object containing only values explicitly supplied via env vars.
function getEnvOverrides(): Partial<ZodPgConnectionConfig> {
  const overrides: Partial<ZodPgConnectionConfig> = {};
  if (process.env.POSTGRES_HOST) overrides.host = process.env.POSTGRES_HOST;
  if (process.env.POSTGRES_USER) overrides.user = process.env.POSTGRES_USER;
  if (process.env.POSTGRES_PASSWORD)
    overrides.password = process.env.POSTGRES_PASSWORD;
  if (process.env.POSTGRES_DB) overrides.database = process.env.POSTGRES_DB;
  if (process.env.POSTGRES_PORT) overrides.port = process.env.POSTGRES_PORT;
  if (process.env.POSTGRES_SSL !== undefined)
    overrides.ssl = process.env.POSTGRES_SSL === 'true';
  return overrides;
}

export const getConfiguration = async (
  overrides: Partial<ZodPgConfig> = {}
): Promise<ZodPgConfig> => {
  const explorer = cosmiconfig('zod-pg');
  const result = await explorer.search();
  const envOverrides = getEnvOverrides();

  if (!result) {
    return {
      ...baseConfig,
      ...overrides,
      connection: { ...baseDefaults, ...envOverrides, ...overrides.connection },
    };
  }

  const config = result.config;

  // Precedence (lowest -> highest): base defaults < config file < env overrides
  return {
    ...baseConfig,
    ...config,
    ...overrides,
    connection: {
      ...baseDefaults,
      ...(config.connection || {}),
      ...envOverrides,
      ...overrides.connection,
    },
  };
};

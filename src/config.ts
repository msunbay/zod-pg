import { cosmiconfig } from 'cosmiconfig';

import type { ZodPgConfig, ZodPgConnectionConfig } from './types.js';

// Base defaults independent of environment.
export const DEFAULT_CONFIGURATION: ZodPgConfig = {
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
  port: 5432,
  ssl: false,
  schemaName: 'public',

  zodVersion: '3',
  outputDir: './zod-schemas',
  moduleResolution: 'commonjs',
  cleanOutput: false,

  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',

  caseTransform: true,
  singularize: true,
  coerceDates: true,
  defaultEmptyArray: false,
  defaultNullsToUndefined: true,
  defaultUnknown: false,
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

  // Precedence (lowest -> highest): base defaults < config file < env overrides
  return {
    ...DEFAULT_CONFIGURATION,
    ...result?.config,
    ...envOverrides,
    ...overrides,
  };
};

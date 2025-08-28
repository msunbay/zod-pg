import { runCli, ZodDbsCliConfig } from 'zod-dbs-cli';

import { getAppVersion } from './version.js';

/**
 * Main entrypoint: connects to Postgres, cleans output, generates Zod schemas for all tables, and writes an index file.
 */
export const main = async (overrides?: Partial<ZodDbsCliConfig>) => {
  const appVersion = await getAppVersion();

  await runCli({
    appName: 'zod-pg',
    appVersion,
    overrides: { ...overrides, provider: 'pg' },
  });
};

import { runCli, ZodDbsCliConfig } from 'zod-dbs-cli';

/**
 * Main entrypoint: connects to Postgres, cleans output, generates Zod schemas for all tables, and writes an index file.
 */
export const main = async (overrides?: Partial<ZodDbsCliConfig>) => {
  await runCli({
    appName: 'zod-pg',
    overrides: { ...overrides, provider: 'pg' },
  });
};

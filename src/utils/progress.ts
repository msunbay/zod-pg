import ora from 'ora';

import type { ZodPgProgress } from '../types.js';

const PROGRESS_STATUS: Record<ZodPgProgress, string> = {
  connecting: 'Connecting to Postgres database...',
  fetchingSchema: 'Fetching schema information...',
  generating: 'Generating Zod schemas for tables...',
  done: 'Zod schemas generated successfully.',
};

const silentProgressHandler = {
  onProgress: () => {}, // No-op in silent mode
  done: () => {},
  fail: () => {},
};

export const createProgressHandler = (silent?: boolean) => {
  if (silent) return silentProgressHandler;

  const spinner = ora();

  return {
    onProgress: (status: ZodPgProgress) => {
      if (spinner.isSpinning) spinner.succeed();
      spinner.start(PROGRESS_STATUS[status] || status);
    },
    done: () => {
      spinner.succeed();
    },
    fail: () => {
      spinner.fail();
    },
  };
};

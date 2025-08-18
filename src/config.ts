import { cosmiconfig } from 'cosmiconfig';

import type { ZodPgConfig } from './types.js';

export const getConfiguration = async (): Promise<ZodPgConfig> => {
  const explorer = cosmiconfig('zod-pg');
  const result = await explorer.search();

  if (!result) {
    return {
      connection: {
        host: 'localhost',
        user: 'postgres',
        password: 'postgres',
        database: 'postgres',
        port: '5432',
      },
      outputDir: './zod-schemas',
    };
  }

  const config = result.config;

  return {
    ...config,
    connection: {
      ...config.connection,
    },
  };
};

import { Client } from 'pg';

import { ZodPgConnectionConfig } from '../types.js';

export const createConnectionString = (
  options: ZodPgConnectionConfig
): string => {
  const { host, port, database, user, password, connectionString } = options;

  if (connectionString) {
    return connectionString;
  }

  if (!user || !password || !host || !port || !database) {
    throw new Error(
      'Incomplete connection configuration. Please provide all required fields.'
    );
  }

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
};

export const createClient = (options: ZodPgConnectionConfig) => {
  return new Client({
    connectionString: createConnectionString(options),
    ssl: options.ssl,
    application_name: 'zod-pg',
  });
};

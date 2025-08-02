import { program } from 'commander';

import { getConfiguration } from './config.js';
import { generateZodSchemas } from './generateZodSchemas.js';
import {
  enableDebug,
  logAppName,
  logDebug,
  logError,
  logSetting,
  toError,
} from './utils/index.js';
import { maskConnectionString } from './utils/mask.js';
import { createProgressHandler } from './utils/progress.js';
import { getAppVersion } from './utils/version.js';

/**
 * Main entrypoint: connects to Postgres, cleans output, generates Zod schemas for all tables, and writes an index file.
 */
export const main = async (port?: number) => {
  const config = await getConfiguration();
  const appVersion = await getAppVersion();

  program.name('zod-pg');
  program.description('Generates Zod schemas from PostgreSQL database tables.');
  program.option(
    '-o,--output <path>',
    'Output directory for generated schemas',
    config.outputDir
  );
  program.option('--silent', 'Suppress all console output', config.silent);
  program.option(
    '--module <type>',
    'Module resolution type for generated files (commonjs or esm)',
    config.moduleResolution || 'commonjs'
  );
  program.option(
    '--clean',
    'Clean output directory before generating schemas',
    config.cleanOutput
  );
  program.option(
    '--coerce-dates',
    'Use z.coerce.date() for date fields in read schemas',
    config.coerceDates
  );
  program.option(
    '--exclude <regex>',
    'Exclude tables matching this regex',
    config.exclude
  );
  program.option(
    '--include <regex>',
    'Include only tables matching this regex',
    config.include
  );
  program.option(
    '--schema <name>',
    'Specify schema name (default: public)',
    config.schemaName || 'public'
  );
  program.option(
    '--json-schema-import-location <path>',
    'Path to import JSON schemas',
    config.jsonSchemaImportLocation
  );
  program.option(
    '--connection-string <string>',
    'Postgres connection string',
    config.connection.connectionString
  );
  program.option(
    '--password <string>',
    'Postgres password',
    config.connection.password || process.env.POSTGRES_PASSWORD
  );
  program.option(
    '--user <string>',
    'Postgres user',
    config.connection.user || process.env.POSTGRES_USER || 'postgres'
  );
  program.option(
    '--database <string>',
    'Postgres database',
    config.connection.database || process.env.POSTGRES_DB || 'postgres'
  );
  program.option(
    '--host <string>',
    'Postgres host',
    config.connection.host || process.env.POSTGRES_HOST || 'localhost'
  );
  program.option(
    '--ssl',
    'Use SSL for Postgres connection',
    config.connection.ssl ?? process.env.POSTGRES_SSL === 'true'
  );
  program.option(
    '--port <number>',
    'Postgres port',
    port?.toString() ||
      config.connection.port ||
      process.env.POSTGRES_PORT ||
      '5432'
  );
  program.option(
    '--zod-version <number>',
    'Zod version to use (default: 3)',
    (value) => parseInt(value, 10),
    config.zodVersion || 3
  );
  program.option(
    '--debug',
    'Enable debug logging',
    () => {
      enableDebug();
      return true;
    },
    false
  );

  program.parse();
  const options = program.opts();

  let connectionString = options.connectionString;

  if (!connectionString) {
    const { user, password, host, port, database } = options;

    connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  const cliConfig = {
    defaultEmptyArray: true,
    stringifyJson: true,

    ...config,
    connection: {
      connectionString,
      ssl: options.ssl,
    },
    silent: options.silent,
    outputDir: options.output,
    cleanOutput: options.clean,
    coerceDates: options.coerceDates,
    schemaName: options.schema,
    exclude: options.exclude,
    include: options.include,
    jsonSchemaImportLocation: options.jsonSchemaImportLocation,
    moduleResolution: options.module,
    zodVersion: options.zodVersion,
  };

  if (!cliConfig.silent) {
    logAppName(`zod-pg CLI v${appVersion}`);

    logSetting('output', cliConfig.outputDir);
    if (cliConfig.cleanOutput) logSetting('clean-output', 'true');
    if (cliConfig.coerceDates) logSetting('coerce-dates', 'true');
    logSetting('module', cliConfig.moduleResolution);
    logSetting('zod-version', cliConfig.zodVersion);
    logSetting(
      'connection',
      maskConnectionString(cliConfig.connection.connectionString)
    );
    logSetting('ssl', cliConfig.connection.ssl ? 'true' : 'false');
    logSetting('schema', cliConfig.schemaName);

    if (process.env.DEBUG) logSetting('debug', process.env.DEBUG);

    if (cliConfig.include) logSetting('include', options.include);
    if (cliConfig.exclude) logSetting('exclude', options.exclude);

    if (cliConfig.jsonSchemaImportLocation) {
      logSetting('json-import-location', cliConfig.jsonSchemaImportLocation);
    }

    console.log();
  }

  const spinner = createProgressHandler(cliConfig.silent);

  try {
    await generateZodSchemas({
      ...cliConfig,
      onProgress: spinner.onProgress,
    });

    spinner.done();
  } catch (error) {
    spinner.fail();

    logError(toError(error).message);
    logDebug(error);

    process.exit(1);
  }
};

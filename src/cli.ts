import { program } from 'commander';

import { getConfiguration } from './config.js';
import { generateZodSchemas } from './generateZodSchemas.js';
import { ZodPgParsedConfig } from './types.js';
import { logAppName, logError, logSetting, toError } from './utils/index.js';
import { createProgressHandler } from './utils/progress.js';

/**
 * Main entrypoint: connects to Postgres, cleans output, generates Zod schemas for all tables, and writes an index file.
 */
export const main = async () => {
  const config = await getConfiguration();

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
    'Module type for generated files (commonjs or esm)',
    config.outputModule || 'commonjs'
  );

  program.option(
    '--clean',
    'Clean output directory before generating schemas',
    config.cleanOutput
  );

  program.option(
    '--exclude <regex>',
    'Exclude tables matching this regex',
    config.excludeRegex
  );
  program.option(
    '--include <regex>',
    'Include only tables matching this regex',
    config.includeRegex
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
    config.connection.port || process.env.POSTGRES_PORT || '5432'
  );

  program.parse();
  const options = program.opts();

  let connectionString = options.connectionString;

  if (!connectionString) {
    const { user, password, host, port, database } = options;

    connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  const cliConfig: ZodPgParsedConfig = {
    ...config,
    connection: {
      connectionString,
      ssl: options.ssl,
    },
    silent: options.silent,
    outputDir: options.output,
    cleanOutput: options.clean,
    schemaName: options.schema,
    excludeRegex: options.exclude ? new RegExp(options.exclude) : undefined,
    includeRegex: options.include ? new RegExp(options.include) : undefined,
    jsonSchemaImportLocation: options.jsonSchemaImportLocation,
    outputModule: options.module,
  };

  // Mask password in connection string for logging
  const maskedConnectionString = cliConfig.connection.connectionString.replace(
    /(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/,
    '$1****$2'
  );

  if (!cliConfig.silent) {
    logAppName(`zod-pg CLI`);

    logSetting('output', cliConfig.outputDir);
    logSetting('connection', maskedConnectionString);
    logSetting('ssl', cliConfig.connection.ssl ? 'enabled' : 'disabled');
    logSetting('schema', cliConfig.schemaName);

    if (cliConfig.includeRegex) logSetting('include', options.include);
    if (cliConfig.excludeRegex) logSetting('exclude', options.exclude);

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
    process.exit(1);
  }
};

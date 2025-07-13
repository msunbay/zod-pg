import { program } from 'commander';

import { generateZodSchemas } from './generateZodSchemas';
import { logAppName, logSetting } from './utils';

/**
 * Main entrypoint: connects to Postgres, cleans output, generates Zod schemas for all tables, and writes an index file.
 */
export const main = async () => {
  const version = require('../package.json').version;
  logAppName(`zod-pg CLI - v${version}`);

  program.name('zod-pg');
  program.description('Generates Zod schemas from PostgreSQL database tables.');
  program.requiredOption(
    '-o,--output <path>',
    'Output directory for generated schemas'
  );

  program.option('--clean', 'Clean output directory before generating schemas');

  program.option('--exclude <regex>', 'Exclude tables matching this regex');
  program.option(
    '--include <regex>',
    'Include only tables matching this regex'
  );
  program.option('--schema <name>', 'Specify schema name (default: public)');
  program.option(
    '--json-schema-import-location <path>',
    'Path to import JSON schemas'
  );

  program.option('--connection-string <string>', 'Postgres connection string');

  program.option(
    '--password <string>',
    'Postgres password',
    process.env.POSTGRES_PASSWORD
  );
  program.option('--user <string>', 'Postgres user', process.env.POSTGRES_USER);
  program.option(
    '--database <string>',
    'Postgres database',
    process.env.POSTGRES_DB
  );
  program.option('--host <string>', 'Postgres host', process.env.POSTGRES_HOST);
  program.option(
    '--ssl',
    'Use SSL for Postgres connection',
    process.env.POSTGRES_SSL === 'true'
  );
  program.option(
    '--port <number>',
    'Postgres port',
    process.env.POSTGRES_PORT || '5432'
  );

  program.parse();

  const options = program.opts();
  const outputDir = options.output;
  const cleanOutput = options.clean || false;
  const excludeRegex = options.exclude
    ? new RegExp(options.exclude)
    : undefined;
  const includeRegex = options.include
    ? new RegExp(options.include)
    : undefined;
  const schemaName = options.schema || 'public';
  const jsonSchemaImportLocation = options.jsonSchemaImportLocation;

  let connectionString = options.connectionString;
  const ssl = options.ssl;

  if (!connectionString) {
    const { user, password, host, port, database } = options;

    connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  // Mask password in connection string for logging
  const maskedConnectionString = connectionString.replace(
    /(postgres(?:ql)?:\/\/[^:]+:)[^@]+(@)/,
    '$1****$2'
  );

  logSetting('output', outputDir);
  logSetting('connection', maskedConnectionString);
  logSetting('ssl', ssl ? 'enabled' : 'disabled');
  logSetting('schema', schemaName);

  if (includeRegex) logSetting('include', options.include);
  if (excludeRegex) logSetting('exclude', options.exclude);

  if (jsonSchemaImportLocation) {
    logSetting('json-import-location', jsonSchemaImportLocation);
  }

  console.log();

  await generateZodSchemas({
    connectionString,
    outputDir,
    cleanOutput,
    schemaName,
    includeRegex,
    excludeRegex,
    jsonSchemaImportLocation,
    ssl,
  });
};

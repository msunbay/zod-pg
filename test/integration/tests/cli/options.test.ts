import { execSync } from 'child_process';

import { getCliPath } from '../../testDbUtils.js';

const cliPath = getCliPath();

it('outputs default options', async () => {
  const output = execSync(`node ${cliPath} --provider pg --help`, {
    stdio: 'pipe',
  });

  expect(output.toString()).toMatchInlineSnapshot(`
    "Usage: zod-pg [options]

    Generates Zod schemas from database schema.

    Options:
      -V, --version                         output the version number
      -o,--output-dir <path>                Output directory for generated schemas
      --silent                              Suppress all console output
      --module-resolution <type>            Module resolution type for generated
                                            files (commonjs or esm)
      --clean-output                        Clean output directory before generating
                                            schemas
      --no-coerce-dates                     Disable using z.coerce.date() for date
                                            fields in read schemas
      --no-stringify-json                   Disable JSON.stringify() on json fields
                                            in write schemas
      --stringify-dates                     Convert dates to ISO strings in write
                                            schemas
      --default-empty-array                 Provide empty arrays as defaults for
                                            nullable array fields
      --object-name-casing <type>           Casing for generated object/type names
                                            (choices: "PascalCase", "camelCase",
                                            "snake_case", default: "PascalCase")
      --field-name-casing <type>            Casing for field/property names in
                                            schemas & records (choices: "camelCase",
                                            "snake_case", "PascalCase",
                                            "passthrough", default: "camelCase")
      --no-case-transform                   Disable case transformations /
                                            conversions for generated schemas
      --no-singularization                  Disable singularization of type and enum
                                            names
      --exclude <regex>                     Exclude tables matching this regex
      --include <regex>                     Include only tables matching this regex
      --schema-name <name>                  Specify schema name (default: public)
      --json-schema-import-location <path>  Path to import JSON schemas
      --zod-version <number>                Zod version to use
      --connection-string <string>          Connection string
      --password <string>                   Database password
      --user <string>                       Database user
      --database <string>                   Database name
      --host <string>                       Database host
      --ssl                                 Use SSL for database connection
      --port <number>                       Database port
      --debug                               Enable debug logging (default: false)
      -h, --help                            display help for command
    "
  `);
});

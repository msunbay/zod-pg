# zod-pg

![npm version](https://img.shields.io/npm/v/zod-pg?style=flat-square)
![license](https://img.shields.io/npm/l/zod-pg?style=flat-square)
![downloads](https://img.shields.io/npm/dm/zod-pg?style=flat-square)

**zod-pg** is a code generation tool that creates [Zod](https://github.com/colinhacks/zod) schemas and TypeScript types from your PostgreSQL database schema. It generates validation schemas that match your database structure, helping keep your TypeScript types synchronized with your database schema.

zod-pg supports PostgreSQL's type system including arrays, enums, and custom types, and generates validation schemas with TypeScript integration.

Under the hood zod-pg uses [zod-dbs](https://github.com/msolvaag/zod-dbs) that provides a consistent interface for generating schemas from various databases, including PostgreSQL.

## Table of Contents

- [Key Features](#key-features)
- [Requirements](#requirements)
- [Why zod-pg?](#why-zod-pg)
- [Installation](#installation)
- [Usage](#usage)
  - [With connection string](#with-connection-string)
  - [With options](#with-options)
  - [With environment variables](#with-environment-variables)
  - [Exclude / Include Tables](#exclude--include-tables)
  - [All Options](#all-options)
- [Configuration File](#configuration-file)
  - [Example Configuration File](#example-configuration-file)
- [Output File Structure](#output-file-structure)
- [Schema Output](#schema-output)
  - [The Read Schemas](#the-read-schemas)
  - [The Write Schemas](#the-write-schemas)
  - [Casing](#casing)
  - [Singularization](#singularization)
- [Customizing Generated Models with Hooks](#customizing-generated-models-with-hooks)
  - [Available Hooks](#available-hooks)
- [JSON Schema Support](#json-schema-support)
  - [Setting up JSON Schema Integration](#setting-up-json-schema-integration)
- [Extending schemas](#extending-schemas)
- [Contributing](#contributing)

## Key Features

- **Database-First Development** – Generate schemas directly from your PostgreSQL database.
- **Multiple Schema Types** – Separate read, insert, and update schemas for clearer intent.
- **Multiple Zod Versions** – Generate for Zod v3, v4, or the lightweight v4-mini build.
- **PostgreSQL Coverage** – Arrays, enums, custom types, materialized views, foreign tables.
- **Type Detection** – Detects serial, enum, array, and nullable characteristics automatically.
- **Customization** – Hooks, casing transformations, singularization control.
- **Organized Output** – Predictable file structure (constants, types, per-table schemas).
- **No Runtime Dependencies** – Generated artifacts only depend on Zod.

## Requirements

- **PostgreSQL 9.3+**
- **Node.js 20+**

## Why zod-pg?

Manually writing and maintaining TypeScript types and Zod schemas for database tables is time-consuming and error-prone.

zod-pg automates this process by generating type-safe validation schemas directly from your PostgreSQL database schema. This approach ensures your validation logic stays synchronized with your database structure, eliminating the manual work of writing and updating schemas when your database changes. Whether you're building APIs that need request validation, working with complex PostgreSQL features like arrays and enums, or maintaining type safety across your entire stack, zod-pg bridges the gap between your database and TypeScript application.

## Installation

```sh
npm install --save-dev zod-pg
# or
pnpm add -D zod-pg
```

## Usage

### With connection string

```sh
npx zod-pg --connection "postgres://user:password@localhost:5432/dbname" --ssl --output-dir ./src/output
```

### With options

You can also specify options directly:

```sh
npx zod-pg --user postgres --password secret --host localhost --port 5432 --database mydb --ssl --output-dir ./src/output
```

### With environment variables

zod-pg can read connection details from environment variables. Set the following variables:

- `ZOD_PG_USER`
- `ZOD_PG_PASSWORD`
- `ZOD_PG_HOST`
- `ZOD_PG_PORT`
- `ZOD_PG_DATABASE`
- `ZOD_PG_SSL` (optional, defaults to `false`)

Then run:

```sh
npx zod-pg --output-dir ./src/output
```

#### Using .env files:

zod-pg does not automatically load `.env` files, but you can use a package like `dotenv-cli` to load them before running zod-pg. For example:

```sh
dotenv -e .env npx zod-pg --output-dir ./src/output
```

### Exclude / Include Tables

You can exclude specific tables from schema generation using the `--exclude` option with a regex pattern. For example, to exclude all tables starting with "temp":

```sh
npx zod-pg --exclude '^temp_' --output-dir ./src/output
```

To include only specific tables, use the `--include` option with a regex pattern. For example, to include only tables starting with "user" or "account:

```sh
npx zod-pg --include '^(user|account)' --output-dir ./src/output
```

Note that if you use both `--exclude` and `--include` options together, the `--include` option is applied first, then the `--exclude` option is applied to the included tables.

### All Options

All CLI options are optional. Sensible defaults are applied (e.g. output defaults to `./zod-schemas`, schema defaults to `public`). Values can be provided via:

- CLI flags (highest precedence)
- Environment variables (connection fields)
- Config file (`zod-pg.config.{js,ts,json}`)
- Built-in defaults

Negative flags (`--no-*`) disable a feature that is enabled by default.

| Option                                 | Description                                                                                       | Default         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------- |
| `--connection-string <string>`         | PostgreSQL connection string (overrides individual host/port/user/etc).                           |                 |
| `-o, --output-dir <path>`              | Output directory for generated files.                                                             | `./zod-schemas` |
| `--clean-output`                       | Delete the output directory before generation.                                                    | `false`         |
| `--no-coerce-dates`                    | Disable using `z.coerce.date()` for date columns in read schemas (coercion enabled by default).   | `false`         |
| `--no-stringify-json`                  | Disable `JSON.stringify()` transforms for `json` fields in write schemas.                         | `false`         |
| `--stringify-dates`                    | Add `.toISOString()` transforms for date fields in write schemas.                                 | `false`         |
| `--default-empty-array`                | Default nullable array fields to `[]` in write schemas.                                           | `false`         |
| `--object-name-casing <value>`         | Casing for object/type names (one of: `PascalCase`, `camelCase`, `snake_case`).                   | `PascalCase`    |
| `--field-name-casing <value>`          | Casing for field/property names (one of: `PascalCase`, `camelCase`, `snake_case`, `passthrough`). | `camelCase`     |
| `--no-case-transform`                  | Disable transforming property name casing (skips base schema + transform helpers).                | `false`         |
| `--no-singularization`                 | Preserve plural table / enum names (singularization on by default).                               | `false`         |
| `--include <regex>`                    | Include only tables matching this regex (applied before exclude).                                 |                 |
| `--exclude <regex>`                    | Exclude tables matching this regex.                                                               |                 |
| `--json-schema-import-location <path>` | Path to import custom JSON field schemas from.                                                    |                 |
| `--module-resolution <type>`           | Module resolution: `commonjs` or `esm`.                                                           | `commonjs`      |
| `--zod-version <version>`              | Target Zod variant: `3`, `4`, or `4-mini`.                                                        | `3`             |
| `--schema-name <name>`                 | Database schema to introspect.                                                                    | `public`        |
| `--host <host>`                        | PostgreSQL host (ignored if connection string provided).                                          | `localhost`     |
| `--port <number>`                      | PostgreSQL port (ignored if connection string provided).                                          | `5432`          |
| `--user <user>`                        | PostgreSQL user (ignored if connection string provided).                                          | `postgres`      |
| `--password <password>`                | PostgreSQL password (ignored if connection string provided).                                      |                 |
| `--database <name>`                    | PostgreSQL database name (ignored if connection string provided).                                 | `postgres`      |
| `--ssl`                                | Use SSL for connection.                                                                           | `false`         |
| `--silent`                             | Suppress console output (still writes files).                                                     | `false`         |
| `--debug`                              | Enable verbose debug logging.                                                                     | `false`         |
| `--help`                               | Show help and exit.                                                                               |                 |

## Configuration File

In addition to CLI options, you can use configuration files to set your options. zod-pg uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig).

### Example Configuration File

**zod-pg.config.ts:**

```typescript
import type { ZodPgConfig } from 'zod-pg';

const config: ZodPgConfig = {
  user: 'postgres',
  database: 'mydb',
  password: 'secret',
  host: 'localhost',
  port: 5432,
  schemaName: 'public',

  outputDir: './src/generated',
  cleanOutput: true,
  include: ['users', 'posts'],
  exclude: ['^temp_'],
  moduleResolution: 'esm',
  zodVersion: '4',
  defaultEmptyArray: true,
};

export default config;
```

**zod-pg.config.js:**

```javascript
module.exports = {
  user: 'postgres',
  database: 'mydb',
  password: 'secret',
  host: 'localhost',
  port: 5432,
  schemaName: 'public',
  ssl: false,
  outputDir: './src/generated',
};
```

## Output File Structure

The generator creates a predictable structure:

- `output/constants.ts` – Constants for all table and view names.
- `output/types.ts` – TypeScript types for all tables and views.
- `output/tables/<table>/schema.ts` – Zod schemas for the table (read / insert / update; plus base + transform when casing enabled).
- `output/tables/<table>/index.ts` – Re-exports for the table.
- `output/tables/index.ts` – Aggregated exports of all table schemas & types.
- (Folders `views/` and `materialized_views/` are generated similarly when those relation types exist.)

## Schema Output

The generated Zod schemas will look something like this: (example for a "users" table)

```ts
// output/tables/users/schema.ts
import { z } from "zod";

export const UsersTableSchema = z.object({..});
export const UsersTableInsertSchema = z.object({..});
export const UsersTableUpdateSchema = UsersTableInsertSchema.partial();

export interface UserRecord {
  // TypeScript interface with proper types
}

export interface UserInsertRecord {
  // TypeScript interface for insert operations
}

export type UserUpdateRecord = Partial<UserInsertRecord>;
```

Since reading and writing are two different operations, zod-pg generates separate schemas for reads, inserts and updates. The `UsersTableInsertSchema` is used for creating new records, while the `UsersTableUpdateSchema` is a partial version of the insert schema, allowing you to update only specific fields.

### The Read Schemas

- Used for reading data from the database.
- Does not enforce write constraints (e.g., max length).
- By default transforms nulls to `undefined`, making it easier to work with optional fields in TypeScript.
- Optionally defaults nullable array fields to empty arrays.

### The Write Schemas

- Enforces field constraints such as max length, ensuring that your data adheres to the database schema.
- By default transforms `json` fields to strings.
- Optionally transforms date fields to ISO strings using `.toISOString()`.
- Excludes only SERIAL/auto-incrementing columns and columns from non-table relations (views, etc.).

### Casing

zod-pg supports different casing styles for generated schemas and types. By default zod-pg uses `PascalCase` for object names and `camelCase` for properties. You can specify the desired casing for field names and object names using the `--field-name-casing` and `--object-name-casing` options.
The `--no-case-transform` option disables the automatic casing transformation for field names, which means that the generated schemas will use the original database column names as-is without any transformation.

### Singularization

By default zod-pg converts plural table / view names into singular, PascalCase identifiers when generating TypeScript record types, insert/update record types, enum names, and related constants / transform helpers. This keeps generated symbols concise and aligned with typical TypeScript naming conventions.

Example:

| Database object          | Generated names                                                           |
| ------------------------ | ------------------------------------------------------------------------- |
| `users` (table)          | `UserRecord`, `UserInsertRecord`, `UserUpdateRecord`                      |
| `users_accounts` (table) | `UserAccountRecord`, `UserAccountInsertRecord`, `UserAccountUpdateRecord` |
| `users.roles` (enum)     | `UserRole`                                                                |

If you would prefer the generated identifiers to preserve the original (often plural / snake_case) names, disable singularization with the CLI flag:

```
npx zod-pg --no-singularization
```

Or in a config file:

```ts
export default {
  // ...other config
  singularization: false,
};
```

When disabled, names are still cased according to your casing settings, but the plural form is retained (e.g. `UsersRecord`).

## Customizing Generated Models with Hooks

zod-pg provides hooks to customize the generated models during generation. These hooks allow you to add custom validation, transformations, or modifications to your schemas.

### Available Hooks

#### `onColumnModelCreated`

This hook is called for each column after its initial model is created, allowing you to modify individual column properties.

```typescript
onColumnModelCreated: (column) => {
  // Add email validation to email columns
  if (column.name === 'email') {
    // Note that this only applies to the write schema.
    // The read schema will still output the field as a z.string.
    column.type = 'email';

    // Additional validation / transformation
    column.writeTransforms = ['trim', 'lowercase'];
  }

  // Add minimum length to password fields
  if (column.name === 'password') {
    // Note that this only applies to the write schema.
    column.minLen = 8;
  }

  // Add custom transformations based on table name
  if (column.tableName === 'users') {
    // Add any table-specific customizations
  }

  return column;
};
```

#### `onTableModelCreated`

This hook is called for each table after all its columns have been processed, allowing you to modify the table model.

```typescript
onTableModelCreated: (table) => {
  // Add custom transformations based on table name
  if (table.name === 'users') {
    // Add any table-specific customizations
  }

  return table;
};
```

## JSON Schema Support

zod-pg cannot determine the structure of JSON fields in your database. To use Zod schemas for JSON fields, you can use the `--json-schema-import-location` option.
When this option is provided, zod-pg will import Zod schemas from the specified location for JSON fields in your database.

### Setting up JSON Schema Integration

Say you have a "user" table with a JSON field called "profile", and you want to use a Zod schema for that JSON field.

**Step 1: Run zod-pg with JSON schema import location**

Start by running, e.g.,

```sh
npx zod-pg --json-schema-import-location '../../json' --output-dir ./schema/generated
```

**Step 2: Generated schema imports your JSON schemas**

This will create a `./schema/generated/tables/users/schema.ts` file looking similar to this:

```ts
import { z } from 'zod';

import { UserProfileSchema } from '../../json';

export const UsersTableSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  profile: UserProfileSchema,
});
```

The JSON Zod schema name is derived from `[Singular(TableName)][FieldName]Schema`, so in this case, it will look for `UserProfileSchema` in the specified import location.

**Step 3: Create your JSON schemas**

Then you can create a Zod schema for the JSON field in your specified import location.

e.g

```ts
// src/schema/json.ts
import { z } from 'zod';

export const UserProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  age: z.number().optional(),
});
```

## Extending schemas

It is possible to extend the generated Zod schemas with additional fields / rules / transformations.
This is especially handy if you are doing a joined query.

To extend a read schema you need to import the base read schema and apply the casing transformations afterwards (if needed).
e.g.

```ts
import {
  transformUserBaseRecord,
  UsersTableBaseSchema,
} from '[output]/tables/users';

const ExtendedSchema = UsersTableBaseSchema.extend({
  permissions: z.array(z.string()).nullish().optional(),
  signed_in_at: z.coerce.date().nullish().optional(),
}).transform((data) => ({
  ...transformUserBaseRecord(data),
  permissions: data.permissions,
  signedInAt: data.signed_in_at,
}));
```

If you have disabled case transforms (`--no-case-transform`) then there are no "base" schemas or transform functions.
And you can just extend the read schema like:

```ts
import { UsersTableSchema } from '[output]/tables';

const ExtendedSchema = UsersTableSchema.extend({
  permissions: z.array(z.string()).nullish().optional(),
  signed_in_at: z.coerce.date().nullish().optional(),
});
```

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

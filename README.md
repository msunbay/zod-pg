# zod-pg

![npm version](https://img.shields.io/npm/v/zod-pg?style=flat-square)
![license](https://img.shields.io/npm/l/zod-pg?style=flat-square)
![downloads](https://img.shields.io/npm/dm/zod-pg?style=flat-square)

**zod-pg** is a code generation tool that creates [Zod](https://github.com/colinhacks/zod) schemas and TypeScript types from your PostgreSQL database schema. It generates validation schemas that match your database structure, helping keep your TypeScript types synchronized with your database schema.

zod-pg supports PostgreSQL's type system including arrays, enums, and custom types, and generates validation schemas with TypeScript integration.

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
- [Customizing Generated Models with Hooks](#customizing-generated-models-with-hooks)
  - [Available Hooks](#available-hooks)
- [JSON Schema Support](#json-schema-support)
  - [Setting up JSON Schema Integration](#setting-up-json-schema-integration)
- [Extending schemas](#extending-schemas)
- [Contributing](#contributing)

## Key Features

- **Database-First Development** - Generate schemas from your PostgreSQL database
- **Multiple Schema Types** - Separate schemas for reading, inserting, and updating data
- **PostgreSQL Support** - Arrays, enums, custom types, materialized views, and foreign tables
- **Type Detection** - Detects serials, arrays, and enum constraints automatically
- **Customization** - Hooks system and casing transformations
- **File Organization** - Generates organized file structures with imports and TypeScript types
- **No Runtime Dependencies** - Generated schemas use only Zod

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
npx zod-pg --connection "postgres://user:password@localhost:5432/dbname" --ssl --output ./src/output
```

### With options

You can also specify options directly:

```sh
npx zod-pg --user postgres --password secret --host localhost --port 5432 --database mydb --ssl --output ./src/output
```

### With environment variables

zod-pg can read connection details from environment variables. Set the following variables:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_SSL` (optional, defaults to `false`)

Then run:

```sh
npx zod-pg --output ./src/output
```

#### Using .env files:

zod-pg does not automatically load `.env` files, but you can use a package like `dotenv-cli` to load them before running zod-pg. For example:

```sh
dotenv -e .env npx zod-pg --output ./src/output
```

### Exclude / Include Tables

You can exclude specific tables from schema generation using the `--exclude` option with a regex pattern. For example, to exclude all tables starting with "temp":

```sh
npx zod-pg --exclude '^temp_' --output ./src/output
```

To include only specific tables, use the `--include` option with a regex pattern. For example, to include only tables starting with "user" or "account:

```sh
npx zod-pg --include '^(user|account)' --output ./src/output
```

Note that if you use both `--exclude` and `--include` options together, the `--include` option is applied first, then the `--exclude` option is applied to the included tables.

### All Options

| Option                          | Description                                                                                        | Required | Default     |
| ------------------------------- | -------------------------------------------------------------------------------------------------- | -------- | ----------- |
| `--connection`                  | Connection string for PostgreSQL.                                                                  | false    |             |
| `-o, --output`                  | Output directory for generated files.                                                              | true     |             |
| `--clean`                       | Delete the output directory before generation.                                                     | false    | `false`     |
| `--disable-coerce-dates`        | Disables using `z.coerce.date()` for date fields in read schemas (allows string-to-date coercion). | false    | `false`     |
| `--disable-stringify-json`      | Disables stringifying JSON values in write schemas using `JSON.stringify()` transforms.            | false    | `false`     |
| `--disable-case-transform`      | Disables transforming db record field casing. e.g snake_case to camelCase.                         | false    | `false`     |
| `--stringify-dates`             | Convert dates to ISO strings in write schemas using `.toISOString()` transforms.                   | false    | `false`     |
| `--default-empty-array`         | Provide empty arrays as defaults for nullable array fields in write schemas.                       | false    | `false`     |
| `--user`                        | PostgreSQL user name.                                                                              | false    | `postgres`  |
| `--password`                    | PostgreSQL user password.                                                                          | false    |             |
| `--host`                        | PostgreSQL host.                                                                                   | false    | `localhost` |
| `--port`                        | PostgreSQL port.                                                                                   | false    | `5432`      |
| `--database`                    | PostgreSQL database name.                                                                          | false    | `postgres`  |
| `--schema`                      | Specify schema name (default: public)                                                              | false    | `public`    |
| `--ssl`                         | Use SSL for the connection.                                                                        | false    | `false`     |
| `--exclude`                     | Regex pattern to exclude tables from generation.                                                   | false    |             |
| `--include`                     | Regex pattern to include only specific tables.                                                     | false    |             |
| `--json-schema-import-location` | Location to import Zod schemas for JSON fields.                                                    | false    |             |
| `--silent`                      | Suppress output messages during generation.                                                        | false    | `false`     |
| `--module`                      | Module resolution type (esm, commonjs). ESM uses file extensions in imports, CommonJS does not.    | false    | `commonjs`  |
| `--zod-version`                 | Target Zod version (3, 4).                                                                         | false    | `3`         |
| `--help`                        | Show help message.                                                                                 | false    |             |

## Configuration File

In addition to CLI options, you can use configuration files to set your options. zod-pg uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig).

### Example Configuration File

**zod-pg.config.ts:**

```typescript
import type { ZodPgConfig } from 'zod-pg';

const config: ZodPgConfig = {
  connection: {
    connectionString: 'postgresql://user:password@localhost:5432/mydb',
    ssl: false,
  },
  outputDir: './src/generated',
  moduleResolution: 'esm',
  cleanOutput: true,
  include: ['users', 'posts'],
  exclude: ['^temp_'],
  zodVersion: '4',
  stringifyDates: false,
  defaultEmptyArray: true,
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
};

export default config;
```

**zod-pg.config.js:**

```javascript
module.exports = {
  connection: {
    connectionString: 'postgresql://user:password@localhost:5432/mydb',
  },
  outputDir: './src/generated',
  moduleResolution: 'esm',
};
```

## Output File Structure

The generator creates the following files:

- `output/constants.ts` – Constants for all table and view names.
- `output/types.ts` – TypeScript types for all tables and views.
- `output/[tables|views|materialized_views]/[name]/schema.ts` – Zod schema definitions for the table/view.
- `output/[tables|views|materialized_views]/[name]/index.ts` – Zod schema and type exports for the table/view.
- `output/[tables|views|materialized_views]/index.ts` – Exports all schemas / types-

## Schema Output

The generated Zod schemas will look something like this: (example for a "user" table)

```ts
// output/tables/user.ts
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
- Transforms nulls to `undefined`, making it easier to work with optional fields in TypeScript.

### The Write Schemas

- Enforces field constraints such as max length, ensuring that your data adheres to the database schema.
- Transforms `jsonb` fields to strings.
- Excludes only SERIAL/auto-incrementing columns and columns from non-table relations (views, etc.).
- Includes columns with DEFAULT values (like `DEFAULT NOW()`) since applications can still provide explicit values.

## Customizing Generated Models with Hooks

zod-pg provides hooks to customize the generated models during generation. These hooks allow you to add custom validation, transformations, or modifications to your schemas.

### Available Hooks

#### `onColumnModelCreated`

This hook is called for each column after its initial model is created, allowing you to modify individual column properties.

```typescript
onColumnModelCreated: async (column: ZodPgColumn) => {
  // Add email validation to email columns
  if (column.name === 'email') {
    column.type = 'email';
  }

  // Add minimum length to password fields
  if (column.name === 'password') {
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

This hook is called for each table after all its columns have been processed, allowing you to modify the entire table model.

```typescript
onTableModelCreated: async (table: ZodPgTable) => {
  // Add custom description
  table.description = `Generated schema for ${table.tableName} table`;

  // Add custom transformations based on table name
  if (table.tableName === 'users') {
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
npx zod-pg --json-schema-import-location '../../json' --output ./schema/generated
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

The JSON Zod schema name is derived from `[TableName][FieldName]Schema`, so in this case, it will look for `UserProfileSchema` in the specified import location.

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

If you have disabled case transforms (`--disable-case-transform`) then there are no "base" schemas or transform functions.
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

# zod-pg

![npm version](https://img.shields.io/npm/v/zod-pg?style=flat-square)
![license](https://img.shields.io/npm/l/zod-pg?style=flat-square)
![downloads](https://img.shields.io/npm/dm/zod-pg?style=flat-square)

**zod-pg** is a tool that generates [Zod](https://github.com/colinhacks/zod) schemas and TypeScript types from PostgreSQL database schemas. It helps you keep your TypeScript types and validation schemas in sync with your database, reducing manual work and runtime errors.

## Requirements

- **PostgreSQL 9.3+**
- **Node.js 20+**

## Features

- Generate Zod schemas for your PostgreSQL tables, views, materialized views and foreign tables.
- Generate TypeScript types and constants
- Supports enum constraints and json field schema mapping

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

| Option                          | Description                                                                                     | Required | Default     |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | -------- | ----------- |
| `--connection`                  | Connection string for PostgreSQL.                                                               | false    |             |
| `-o, --output`                  | Output directory for generated files.                                                           | true     |             |
| `--clean`                       | Delete the output directory before generation.                                                  | false    | `false`     |
| `--user`                        | PostgreSQL user name.                                                                           | false    | `postgres`  |
| `--password`                    | PostgreSQL user password.                                                                       | false    |             |
| `--host`                        | PostgreSQL host.                                                                                | false    | `localhost` |
| `--port`                        | PostgreSQL port.                                                                                | false    | `5432`      |
| `--database`                    | PostgreSQL database name.                                                                       | false    | `postgres`  |
| `--schema`                      | Specify schema name (default: public)                                                           | false    | `public`    |
| `--ssl`                         | Use SSL for the connection.                                                                     | false    | `false`     |
| `--exclude`                     | Regex pattern to exclude tables from generation.                                                | false    |             |
| `--include`                     | Regex pattern to include only specific tables.                                                  | false    |             |
| `--json-schema-import-location` | Location to import Zod schemas for JSON fields.                                                 | false    |             |
| `--silent`                      | Suppress output messages during generation.                                                     | false    | `false`     |
| `--module`                      | Module resolution type (esm, commonjs). ESM uses file extensions in imports, CommonJS does not. | false    | `commonjs`  |
| `--zod-version`                 | Target Zod version (3, 4).                                                                      | false    | `3`         |
| `--help`                        | Show help message.                                                                              | false    |             |

## Configuration File

In addition to CLI options, you can use configuration files to set your options. zod-pg uses [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) which means it will look for configuration in the following places (in order):

- `package.json` property: `"zod-pg"`
- `.zod-pgrc` file (JSON or YAML)
- `.zod-pgrc.json` file
- `.zod-pgrc.yaml` file
- `.zod-pgrc.yml` file
- `.zod-pgrc.js` file
- `.zod-pgrc.cjs` file
- `.zod-pgrc.mjs` file
- `.zod-pgrc.ts` file
- `zod-pg.config.js` file
- `zod-pg.config.cjs` file
- `zod-pg.config.mjs` file
- `zod-pg.config.ts` file

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
  zodVersion: 4,
  stringifyJson: true,
  stringifyDates: false,
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',

  // Hooks for customizing the generated models
  onColumnModelCreated: async (column) => {
    // Add .trim() to all string fields
    if (column.zodType === 'z.string()') {
      column.zodType = 'z.string().trim()';
    }
    return column;
  },

  onTableModelCreated: async (table) => {
    // Add a description to the table schema
    table.description = `Generated schema for ${table.name} table`;
    return table;
  },
};

export default config;
```

**package.json:**

```json
{
  "zod-pg": {
    "connection": {
      "connectionString": "postgresql://user:password@localhost:5432/mydb"
    },
    "outputDir": "./src/generated",
    "moduleResolution": "esm"
  }
}
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

- `output/constants.ts` – Constants for all table and view names
- `output/types.ts` – TypeScript types for all tables and views
- `output/tables/` – Zod schemas for each table (one file per table)
- `output/tables/index.ts` – Exports all table schemas
- `output/views/` – Zod schemas for each view (one file per view)
- `output/views/index.ts` – Exports all view schemas
- `output/materialized-views/` – Zod schemas for each mview (one file per view)
- `output/materialized-views/index.ts` – Exports all mview schemas
- `output/index.ts` – Exports all schemas and types

## Schema Output

The generated Zod schemas will look like this: (example for a "user" table)

```ts
// output/tables/user.ts
import { z } from "zod";

export const UserSchema = z.object({..});
export const UserTableInsertSchema = z.object({..});
export const UserTableUpdateSchema = UserTableInsertSchema.partial();

export type UserRecord = z.infer<typeof UserSchema>;
export type UserInsertRecord = z.input<typeof UserTableInsertSchema>;
export type UserUpdateRecord = z.input<typeof UserTableUpdateSchema>;
```

Since reading and writing are two different operations, zod-pg generates separate schemas for reads, inserts and updates. The `UserTableInsertSchema` is used for creating new records, while the `UserTableUpdateSchema` is a partial version of the insert schema, allowing you to update only specific fields.

### The Read Schemas

- Used for reading data from the database.
- Does not enforce write constraints (e.g., max length).
- Transforms nulls to `undefined`, making it easier to work with optional fields in TypeScript.

### The Write Schemas

- Enforces field constraints such as max length, ensuring that your data adheres to the database schema.
- Transforms `jsonb` fields to strings.
- Excludes fields that are not writable, such as primary keys or auto-incrementing fields.

## Customizing Generated Models with Hooks

zod-pg provides hooks that allow you to customize the generated models during the generation process. These hooks are useful for adding custom validation, transformations, or modifications to your schemas.

### Available Hooks

#### `onColumnModelCreated`

This hook is called for each column after its initial model is created, allowing you to modify individual column properties.

```typescript
onColumnModelCreated: async (column: ZodPgColumn) => {
  // Add email validation to email columns
  if (column.name === 'email') {
    column.zodType = 'z.string().email()';
  }

  // Add minimum length to password fields
  if (column.name === 'password') {
    column.zodType = 'z.string().min(8)';
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
  table.description = `Generated schema for ${table.name} table (${table.columns.length} columns)`;

  // Add custom transformations based on table name
  if (table.name === 'users') {
    // Add any table-specific customizations
  }

  return table;
};
```

### Hook Usage Examples

#### Example 1: Adding Global String Transformations

```typescript
// zod-pg.config.ts
export default {
  // ... other config
  onColumnModelCreated: async (column) => {
    // Trim all string fields
    if (column.zodType === 'z.string()') {
      column.zodType = 'z.string().trim()';
    }

    // Add email validation
    if (column.name.toLowerCase().includes('email')) {
      column.zodType = 'z.string().email().trim()';
    }

    return column;
  },
};
```

#### Example 2: Adding Conditional Validation

```typescript
// zod-pg.config.ts
export default {
  // ... other config
  onColumnModelCreated: async (column) => {
    // Add URL validation for URL fields
    if (
      column.name.toLowerCase().includes('url') ||
      column.name.toLowerCase().includes('link')
    ) {
      column.zodType = 'z.string().url()';
    }

    // Add UUID validation for ID fields
    if (column.name.toLowerCase().includes('uuid') || column.name === 'id') {
      column.zodType = 'z.string().uuid()';
    }

    return column;
  },

  onTableModelCreated: async (table) => {
    // Add table-level documentation
    table.description = `Schema for ${table.name} table`;

    // Log generated tables
    console.log(`Generated schema for table: ${table.name}`);

    return table;
  },
};
```

#### Example 3: Complex Field Modifications

```typescript
// zod-pg.config.ts
export default {
  // ... other config
  onColumnModelCreated: async (column) => {
    // Handle different column types
    switch (column.dataType) {
      case 'varchar':
      case 'text':
        // Add min/max length based on constraints
        if (column.maxLen) {
          column.zodType = `z.string().max(${column.maxLen})`;
        }
        if (column.minLen) {
          column.zodType = column.zodType.replace(
            'z.string()',
            `z.string().min(${column.minLen})`
          );
        }
        break;

      case 'numeric':
      case 'decimal':
        // Add decimal precision
        column.zodType = 'z.number().multipleOf(0.01)';
        break;

      case 'integer':
        // Add integer validation
        column.zodType = 'z.number().int()';
        if (column.name.toLowerCase().includes('positive')) {
          column.zodType = 'z.number().int().positive()';
        }
        break;
    }

    return column;
  },
};
```

### Column Model Properties

The `ZodPgColumn` object passed to `onColumnModelCreated` contains:

- `name: string` - Column name
- `dataType: string` - PostgreSQL data type
- `zodType: string` - Generated Zod type (can be modified)
- `nullable: boolean` - Whether the column can be null
- `hasDefault: boolean` - Whether the column has a default value
- `maxLen?: number` - Maximum length constraint
- `minLen?: number` - Minimum length constraint
- `enumValues?: string[]` - Enum values if applicable

### Table Model Properties

The `ZodPgTable` object passed to `onTableModelCreated` contains:

- `name: string` - Table name
- `columns: ZodPgColumn[]` - Array of column models
- `type: string` - Table type ('table', 'view', 'materialized_view', etc.)
- `description?: string` - Optional description (can be set)

## JSON Schema Support

zod-pg cannot know the structure of JSON fields in your database. To enable Zod schemas for your JSON fields, you can use the `--json-schema-import-location` option.
When this option is provided, zod-pg will import Zod schemas from the specified location and use them for any JSON fields in your database.

E.g., say you have a "user" table with a JSON field called "profile", and you want to use a Zod schema for that JSON field.

Start by running, e.g.,

```sh
npx zod-pg --json-schema-import-location '../../json' --output ./schema/generated
```

This will create a `./schema/generated/tables/user.ts` file looking similar to this:

```ts
import { z } from 'zod';

import * as json from '../../json';

export const UserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  profile: json.UserProfileSchema,
});
```

The JSON Zod schema name is derived from `[tableName][FieldName]Schema`, so in this case, it will look for `UserProfileSchema` in the specified import location.

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

## Date Handling

zod-pg automatically converts PostgreSQL `timestamp` and `timestamptz` fields to Zod's `z.date()` schema. This means you can work with date fields directly in your TypeScript code without additional conversion.

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

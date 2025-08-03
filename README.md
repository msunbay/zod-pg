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
  - [The Problem](#the-problem)
  - [The zod-pg Solution](#the-zod-pg-solution)
- [Advanced PostgreSQL Features](#advanced-postgresql-features)
  - [Array Types](#array-types)
  - [Enum Detection from Check Constraints](#enum-detection-from-check-constraints)
  - [Complex JSON with Schema Integration](#complex-json-with-schema-integration)
  - [Smart Serial Detection](#smart-serial-detection)
  - [Views and Materialized Views](#views-and-materialized-views)
  - [Constraint Detection](#constraint-detection)
- [Date Handling Options](#date-handling-options)
  - [Coerce Dates](#coerce-dates---coerce-dates)
  - [Stringify Dates](#stringify-dates---stringify-dates)
  - [Best Practices](#best-practices)
- [When to Use zod-pg](#when-to-use-zod-pg)
  - [Use Cases](#use-cases)
- [Installation](#installation)
- [Usage](#usage)
  - [With connection string](#with-connection-string)
  - [With options](#with-options)
  - [With advanced options](#with-advanced-options)
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
  - [Hook Usage Examples](#hook-usage-examples)
  - [Column Model Properties](#column-model-properties)
  - [Table Model Properties](#table-model-properties)
- [JSON Schema Support](#json-schema-support)
  - [Setting up JSON Schema Integration](#setting-up-json-schema-integration)
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

### The Problem

Manually writing and maintaining Zod schemas for database tables is time-consuming and error-prone:

```typescript
// Manual approach - lots of repetitive work
const UserSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string(),
  tags: z.array(z.string()),
  profile: z.object({...}),
  created_at: z.date(),
  updated_at: z.date(),
});

// Separate insert schema - more duplication
const UserInsertSchema = UserSchema.omit({ id: true, created_at: true, updated_at: true });

// Update schema - even more duplication
const UserUpdateSchema = UserInsertSchema.partial();
```

### The zod-pg Solution

Generate everything with one command:

```bash
npx zod-pg --output ./src/schemas
```

```typescript
// Generated from PostgreSQL schema
export const UserSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  name: z.string(),
  tags: z.array(z.string()), // Detected from _text PostgreSQL type
  profile: json.UserProfileSchema, // Custom JSON schema integration
  status: z.enum(['active', 'inactive']), // Extracted from check constraints
  created_at: z.date(),
  updated_at: z.date(),
});

export const UserInsertSchema = z.object({
  email: z.string().email().max(255), // Includes length constraints
  name: z.string().max(100),
  tags: z.array(z.string()).default([]),
  profile: json.UserProfileSchema,
  status: z.enum(['active', 'inactive']).default('active'),
  created_at: z.date(), // DEFAULT values are included in write schemas
  updated_at: z.date(), // Only SERIAL columns are excluded
});

export const UserUpdateSchema = UserInsertSchema.partial();

// TypeScript interfaces included
export interface UserRecord {
  id: number;
  email: string;
  name: string;
  tags: string[];
  profile: UserProfileSchema; // Custom JSON schema type when using --json-schema-import-location
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Write interface without primary key
export interface UserInsertRecord {
  email: string;
  name: string;
  tags?: string[];
  profile: UserProfileSchema;
  status?: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Update interface with optional props
export type UserUpdateRecord = Partial<UserInsertRecord>;
```

## PostgreSQL Features

zod-pg supports PostgreSQL's type system:

### **Array Types**

```sql
-- PostgreSQL
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  tags TEXT[],
  view_counts INTEGER[]
);
```

```typescript
// Generated Zod schemas
export const PostSchema = z.object({
  id: z.number().int(),
  tags: z.array(z.string()),
  viewCounts: z.array(z.number().int()),
});
```

### **Enum Detection from Check Constraints**

```sql
-- PostgreSQL
CREATE TABLE users (
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending'))
);
```

```typescript
// Detected and generated from check constraints
export const USER_STATUS_ENUM = ['active', 'inactive', 'pending'] as const;
export type UserStatus = (typeof USER_STATUS_ENUM)[number];

export const UserSchema = z.object({
  status: z.enum(USER_STATUS_ENUM),
});
```

### **Complex JSON with Schema Integration**

```sql
-- PostgreSQL
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  metadata JSONB
);
```

```typescript
// With JSON schema integration
export const ProfileSchema = z.object({
  id: z.number().int(),
  metadata: json.ProfileMetadataSchema, // Your custom schema
});
```

_See [JSON Schema Support](#json-schema-support) section for detailed configuration._

### **Serial Detection**

```sql
-- PostgreSQL
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,        -- Excluded from insert schemas (SERIAL types only)
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() -- Included in insert schemas (has DEFAULT but not SERIAL)
);
```

```typescript
// Read schema includes everything
export const ArticleSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  createdAt: z.date(),
});

// Insert schema excludes only SERIAL columns
export const ArticleInsertSchema = z.object({
  title: z.string().max(255),
  createdAt: z.date(), // DEFAULT NOW() columns are included
});
```

### **Views and Materialized Views**

Supports all PostgreSQL relation types:

- Regular tables
- Views (read-only schemas)
- Materialized views
- Foreign tables (via foreign data wrappers)

### **Constraint Detection**

- Length constraints (`VARCHAR(255)` → `z.string().max(255)`)
- NOT NULL constraints
- Default values
- Check constraints for enum detection
- Primary key detection (excluded from insert schemas)

## Date Handling Options

zod-pg provides date handling options:

### **Coerce Dates (`--coerce-dates`)**

By default, date fields use `z.date()` which requires actual Date objects. Enable `--coerce-dates` to use `z.coerce.date()` in read schemas, allowing automatic string-to-date conversion:

```sql
-- PostgreSQL
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_date TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Without `--coerce-dates` (default):**

```typescript
// Read schema - requires Date objects
export const EventSchema = z.object({
  id: z.number().int(),
  eventDate: z.date(),
  createdAt: z.date(),
});

// Insert schema - also requires Date objects
export const EventInsertSchema = z.object({
  eventDate: z.date(),
});
```

**With `--coerce-dates`:**

```typescript
// Read schema - accepts strings or Date objects
export const EventSchema = z.object({
  id: z.number().int(),
  eventDate: z.coerce.date(), // Converts strings to dates
  createdAt: z.coerce.date(),
});

// Insert schema - still uses z.date() for strict validation
export const EventInsertSchema = z.object({
  eventDate: z.date(),
  createdAt: z.date(),
});
```

### **Stringify Dates (`--stringify-dates`)**

For APIs that need to serialize dates as ISO strings, use `--stringify-dates` to add automatic date-to-string transforms in write schemas:

```typescript
// With --stringify-dates
export const EventInsertSchema = z
  .object({
    eventDate: z.date(),
    metadata: z.object({
      scheduledAt: z.date(),
    }),
  })
  .transform((data) => ({
    eventDate: data.eventDate.toISOString(),
    metadata: {
      scheduledAt: data.metadata.scheduledAt.toISOString(),
    },
  }));
```

### **Best Practices**

- **Use `--coerce-dates`** when reading data from sources that provide date strings
- **Use `--stringify-dates`** when your API needs to serialize dates as ISO strings
- **Combine both options** for data processing pipelines that handle both formats

## When to Use zod-pg

zod-pg works well for projects that:

- **Use PostgreSQL** - Takes advantage of PostgreSQL's type system
- **Follow database-first development** - Database schema drives application structure
- **Need API validation** - Generate schemas for request/response validation
- **Want to reduce manual schema maintenance** - Synchronize with database changes
- **Use PostgreSQL features** - Arrays, enums, JSONB, custom types
- **Need type safety** - From database to frontend

### Use Cases

- **API Development** - Validate requests against your database schema
- **Database-First Architecture** - Generate application types from database design
- **Data Processing** - Type-safe data transformation and validation
- **Schema Evolution** - Keep validation logic synchronized with database changes
- **Prototyping** - Generate type-safe schemas from database designs

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

### With advanced options

**Enable date coercion and JSON stringification:**

```sh
npx zod-pg --connection "postgres://user:password@localhost:5432/dbname" --output ./src/schemas --coerce-dates --stringify-json
```

**Clean output directory and stringify dates:**

```sh
npx zod-pg --connection "postgres://user:password@localhost:5432/dbname" --output ./src/schemas --clean --stringify-dates
```

**Include only specific tables with date options:**

```sh
npx zod-pg --connection "postgres://user:password@localhost:5432/dbname" --output ./src/schemas --include "^(users|posts)$" --coerce-dates --default-empty-array
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
| `--coerce-dates`                | Use `z.coerce.date()` for date fields in read schemas (allows string-to-date coercion).         | false    | `false`     |
| `--stringify-json`              | Stringify JSON values in write schemas using `JSON.stringify()` transforms.                     | false    | `true`      |
| `--stringify-dates`             | Convert dates to ISO strings in write schemas using `.toISOString()` transforms.                | false    | `false`     |
| `--default-empty-array`         | Provide empty arrays as defaults for nullable array fields in write schemas.                    | false    | `true`      |
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
  coerceDates: true,
  stringifyJson: true,
  stringifyDates: false,
  defaultEmptyArray: true,
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
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
export const UserInsertSchema = z.object({..});
export const UserUpdateSchema = UserInsertSchema.partial();

export interface UserRecord {
  // TypeScript interface with proper types
}

export interface UserInsertRecord {
  // TypeScript interface for insert operations
}

export type UserUpdateRecord = Partial<UserInsertRecord>;
```

Since reading and writing are two different operations, zod-pg generates separate schemas for reads, inserts and updates. The `UserTableInsertSchema` is used for creating new records, while the `UserTableUpdateSchema` is a partial version of the insert schema, allowing you to update only specific fields.

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
    column.renderedWriteType = 'z.string().email()';
  }

  // Add minimum length to password fields
  if (column.name === 'password') {
    column.renderedWriteType = 'z.string().min(8)';
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

### Hook Usage Examples

#### Example 1: Adding Global String validation for write schemas

```typescript
// zod-pg.config.ts
export default {
  // ... other config
  onColumnModelCreated: async (column) => {
    // Trim all string fields
    if (column.renderedWriteType === 'z.string()') {
      column.renderedWriteType = 'z.string().trim()';
    }

    // Add email validation
    if (column.name.toLowerCase().includes('email')) {
      column.renderedWriteType = 'z.string().email().trim()';
    }

    return column;
  },
};
```

#### Example 2: Renaming column properties

```typescript
// zod-pg.config.ts
export default {
  // ... other config
  onColumnModelCreated: async (column) => {
    if (column.tableName === 'users' && column.name === 'user') {
      return { ...column, propertyName: 'userName' };
    }
  },
};
```

### Column Model Properties

The `ZodPgColumn` object passed to `onColumnModelCreated` contains:

- `name: string` - Column name
- `tableName: string` - Name of the table this column belongs to
- `dataType: string` - PostgreSQL data type
- `renderedReadType: string` - Generated Zod type for reading (can be modified)
- `renderedWriteType: string` - Generated Zod type for writing (can be modified)
- `isNullable: boolean` - Whether the column can be null
- `defaultValue?: string` - Default value expression if any
- `maxLen?: number` - Maximum length constraint
- `minLen?: number` - Minimum length constraint
- `enumValues?: string[]` - Enum values if applicable
- `isArray: boolean` - Whether the column is an array type
- `isEnum: boolean` - Whether the column is an enum type
- `isSerial: boolean` - Whether the column is auto-incrementing
- `isWritable: boolean` - Whether column should be included in write schemas
- `propertyName: string` - Transformed property name for generated schemas

### Table Model Properties

The `ZodPgTable` object passed to `onTableModelCreated` contains:

- `tableName: string` - Table name
- `tableSingularName: string` - Singular form of table name
- `schemaName: string` - Database schema name
- `type: ZodPgTableType` - Table type ('table', 'view', 'materialized_view', etc.)
- `readableColumns: ZodPgColumn[]` - Array of columns for read schemas
- `writableColumns: ZodPgColumn[]` - Array of columns for write schemas
- `isWritable: boolean` - Whether table supports write operations
- `enums: ZodPgEnum[]` - Array of enum types found in this table
- `description?: string` - Optional description (can be set)
- `tableReadSchemaName?: string` - Generated read schema name
- `tableInsertSchemaName?: string` - Generated insert schema name
- `tableUpdateSchemaName?: string` - Generated update schema name

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

This will create a `./schema/generated/tables/user.ts` file looking similar to this:

```ts
import { z } from 'zod';

import { UserProfileSchema } from '../../json';

export const UserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  profile: UserProfileSchema,
});
```

The JSON Zod schema name is derived from `[tableName][FieldName]Schema`, so in this case, it will look for `UserProfileSchema` in the specified import location.

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

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

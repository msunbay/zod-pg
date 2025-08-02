# zod-pg

![npm version](https://img.shields.io/npm/v/zod-pg?style=flat-square)
![license](https://img.shields.io/npm/l/zod-pg?style=flat-square)
![downloads](https://img.shields.io/npm/dm/zod-pg?style=flat-square)

**zod-pg** is a powerful database-first development tool that automatically generates comprehensive [Zod](https://github.com/colinhacks/zod) schemas and TypeScript types from your PostgreSQL database schema. It bridges the gap between your database structure and type-safe TypeScript applications, ensuring your validation logic stays perfectly synchronized with your database schema.

Unlike manual schema writing, zod-pg deeply understands PostgreSQL's type system—from basic types to complex arrays, enums, and custom types—and generates production-ready validation schemas with full TypeScript integration.

## Key Features

🚀 **Database-First Development** - Your PostgreSQL schema becomes the single source of truth  
🔄 **Three-Schema Generation** - Separate optimized schemas for reading, inserting, and updating data  
🎯 **Advanced PostgreSQL Support** - Arrays, enums, custom types, materialized views, and foreign tables  
🔍 **Smart Type Detection** - Automatically detects serials, arrays (underscore prefix), and enum constraints  
🎨 **Flexible Customization** - Powerful hooks system and casing transformations  
📦 **Production Ready** - Generates organized file structures with proper imports and TypeScript types  
⚡ **Zero Runtime Dependencies** - Generated schemas are pure Zod with no additional runtime overhead

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
  profile: z.object({...}), // How do you keep this in sync?
  created_at: z.date(),
  updated_at: z.date(),
});

// Separate insert schema - more duplication
const UserInsertSchema = UserSchema.omit({ id: true, created_at: true, updated_at: true });

// Update schema - even more duplication
const UserUpdateSchema = UserInsertSchema.partial();
```

### The zod-pg Solution

One command generates everything, perfectly synchronized with your database:

```bash
npx zod-pg --output ./src/schemas
```

```typescript
// Generated automatically with full PostgreSQL type awareness
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
});

export const UserUpdateSchema = UserInsertSchema.partial();

// TypeScript types included
export type UserRecord = z.infer<typeof UserSchema>;
export type UserInsertRecord = z.input<typeof UserInsertSchema>;
export type UserUpdateRecord = z.input<typeof UserUpdateSchema>;
```

## Advanced PostgreSQL Features

zod-pg provides comprehensive support for PostgreSQL's advanced type system:

### 🔢 **Array Types**

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

### 🏷️ **Enum Detection from Check Constraints**

```sql
-- PostgreSQL
CREATE TABLE users (
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending'))
);
```

```typescript
// Automatically detected and generated
export const USER_STATUS_ENUM = ['active', 'inactive', 'pending'] as const;
export type UserStatus = (typeof USER_STATUS_ENUM)[number];

export const UserSchema = z.object({
  status: z.enum(USER_STATUS_ENUM),
});
```

### 🗂️ **Complex JSON with Schema Integration**

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

### 🎯 **Smart Serial Detection**

```sql
-- PostgreSQL
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,        -- Excluded from insert schemas
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() -- Excluded from insert schemas
);
```

```typescript
// Read schema includes everything
export const ArticleSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  createdAt: z.date(),
});

// Insert schema automatically excludes serials and defaults
export const ArticleInsertSchema = z.object({
  title: z.string().max(255),
});
```

### 🔍 **Views and Materialized Views**

Supports all PostgreSQL relation types:

- Regular tables
- Views (read-only schemas)
- Materialized views
- Foreign tables (via foreign data wrappers)

### ⚙️ **Constraint Detection**

- Length constraints (`VARCHAR(255)` → `z.string().max(255)`)
- NOT NULL constraints
- Default values
- Check constraints for enum detection
- Primary key detection (excluded from insert schemas)

## When to Use zod-pg

zod-pg is perfect for projects that:

✅ **Use PostgreSQL as the primary database** - Takes full advantage of PostgreSQL's rich type system  
✅ **Follow database-first development** - Database schema drives application structure  
✅ **Need robust API validation** - Generate schemas for request/response validation  
✅ **Want to eliminate manual schema maintenance** - Automatic synchronization with database changes  
✅ **Use complex PostgreSQL features** - Arrays, enums, JSONB, custom types  
✅ **Require type safety across the stack** - From database to frontend

### Use Cases

🔗 **API Development** - Validate incoming requests against your exact database schema  
🏗️ **Database-First Architecture** - Let your database design drive your application types  
📊 **Data Processing Pipelines** - Type-safe data transformation and validation  
🔄 **Schema Evolution** - Keep validation logic synchronized as your database evolves  
🚀 **Rapid Prototyping** - Quickly generate type-safe schemas from database designs

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
    if (column.renderedReadType === 'z.string()') {
      column.renderedReadType = 'z.string().trim()';
    }
    if (column.renderedWriteType === 'z.string()') {
      column.renderedWriteType = 'z.string().trim()';
    }
    return column;
  },

  onTableModelCreated: async (table) => {
    // Add a description to the table schema
    table.description = `Generated schema for ${table.tableName} table`;
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
    column.renderedReadType = 'z.string().email()';
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

#### Example 1: Adding Global String Transformations

```typescript
// zod-pg.config.ts
export default {
  // ... other config
  onColumnModelCreated: async (column) => {
    // Trim all string fields
    if (column.renderedReadType === 'z.string()') {
      column.renderedReadType = 'z.string().trim()';
    }
    if (column.renderedWriteType === 'z.string()') {
      column.renderedWriteType = 'z.string().trim()';
    }

    // Add email validation
    if (column.name.toLowerCase().includes('email')) {
      column.renderedReadType = 'z.string().email().trim()';
      column.renderedWriteType = 'z.string().email().trim()';
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
      column.renderedReadType = 'z.string().url()';
      column.renderedWriteType = 'z.string().url()';
    }

    // Add UUID validation for ID fields
    if (column.name.toLowerCase().includes('uuid') || column.name === 'id') {
      column.renderedReadType = 'z.string().uuid()';
      column.renderedWriteType = 'z.string().uuid()';
    }

    return column;
  },

  onTableModelCreated: async (table) => {
    // Add JSDoc comments to the generated schemas
    table.description = `Schema for ${table.tableName} table`;

    // Log generated tables
    console.log(`Generated schema for table: ${table.tableName}`);

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
          column.renderedWriteType = `z.string().max(${column.maxLen})`;
        }
        if (column.minLen) {
          column.renderedWriteType = column.renderedWriteType.replace(
            'z.string()',
            `z.string().min(${column.minLen})`
          );
        }
        break;

      case 'numeric':
      case 'decimal':
        // Add decimal precision
        column.renderedReadType = 'z.number().multipleOf(0.01)';
        column.renderedWriteType = 'z.number().multipleOf(0.01)';
        break;

      case 'integer':
        // Add integer validation
        column.renderedReadType = 'z.number().int()';
        column.renderedWriteType = 'z.number().int()';
        if (column.name.toLowerCase().includes('positive')) {
          column.renderedReadType = 'z.number().int().positive()';
          column.renderedWriteType = 'z.number().int().positive()';
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

# zod-pg

**zod-pg** is a tool that generates [Zod](https://github.com/colinhacks/zod) schemas and TypeScript types from PostgreSQL database schemas. It helps you keep your TypeScript types and validation schemas in sync with your database, reducing manual work and runtime errors.

## Features

- Generate Zod schemas for your PostgreSQL tables
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

### Exclude Tables

You can exclude specific tables from schema generation using the `--exclude` option with a regex pattern. For example, to exclude all tables starting with "temp":

```sh
npx zod-pg --exclude '^temp_' --output ./src/output
```

### All Options

| Option                          | Description                                      | Required | Default     |
| ------------------------------- | ------------------------------------------------ | -------- | ----------- |
| `--connection`                  | Connection string for PostgreSQL.                | false    |             |
| `--user`                        | PostgreSQL user name.                            | false    |             |
| `--password`                    | PostgreSQL user password.                        | false    |             |
| `--host`                        | PostgreSQL host.                                 | false    | `localhost` |
| `--port`                        | PostgreSQL port.                                 | false    | `5432`      |
| `--database`                    | PostgreSQL database name.                        | false    | `postgres`  |
| `--ssl`                         | Use SSL for the connection.                      | false    | `false`     |
| `--exclude`                     | Regex pattern to exclude tables from generation. | false    |             |
| `--json-schema-import-location` | Location to import Zod schemas for JSON fields.  | false    |             |
| `--help`                        | Show help message.                               | false    |             |

## Output File Structure

The generator creates the following files:

- `output/constants.ts` – Constants for all table names
- `output/types.ts` – TypeScript types for all tables
- `output/tables/` – Zod schemas for each table (one file per table)
- `output/tables/index.ts` – Exports all table schemas
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
- Does not enforce write constraints (e.g., max length, min length).
- Transforms nulls to `undefined`, making it easier to work with optional fields in TypeScript.

### The Write Schemas

- Enforces field constraints such as max length, min length, and required fields, ensuring that your data adheres to the database schema.
- Transforms `jsonb` fields to strings.
- Excludes fields that are not writable, such as primary keys or auto-incrementing fields.

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
import { z } from "zod";
import * as json from "../../json";

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
import { z } from "zod";

export const UserProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  age: z.number().optional(),
});
```

## Date Handling

zod-pg automatically converts PostgreSQL `timestamp` and `timestamptz` fields to Zod's `z.date({ coerce: true })` schema. This means you can work with date fields directly in your TypeScript code without additional conversion.

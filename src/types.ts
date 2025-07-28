import { ZodPgColumnInfo } from './database/types.js';

type ZodPgTransform = () => (
  text: string,
  render: (text: string) => string
) => string;

export interface ZodPgColumnBaseModel extends ZodPgColumnInfo {
  /**
   * The property name of the column in the Zod schema.
   * This is typically the column name in camelCase format.
   */
  propertyName: string;
  /**
   * The name of the enum type for the column.
   * This is used when the column is identified as an enum type through check constraints.
   */
  enumTypeName?: string;
  /**
   * The constant name of the enum type for the column.
   * This is used when the column is identified as an enum type through check constraints.
   */
  enumConstantName?: string;
  /**
   * The name of the json Zod schema for the column.
   * This is used when enabling the JSON schema import feature.
   */
  jsonSchemaName?: string;
  /**
   * If `isWritable` is `true`, the column will be included in the insert/update schemas.
   * This is typically `false` for serial columns, but can be set to `false` for read-only columns.
   */
  isWritable: boolean;
  /**
   * If true, the property is marked as deprecated.
   */
  isDeprecated?: boolean;
  /**
   * If `isDeprecated` is true, this is the reason for deprecation.
   */
  isDeprecatedReason?: string;
}

export interface ZodPgColumn extends ZodPgColumnBaseModel {
  /**
   * The rendered property value for the column in the read schema.
   * This is the Zod type / schema, e.g. `z.string()`, `z.number()`, etc.
   */
  renderedReadType: string;
  /**
   * The rendered property value for the column in the write schema.
   * This is the Zod type / schema, e.g. `z.string().max(100)`, `z.number().nullish()`, etc.
   */
  renderedWriteType: string;
  /**
   * The transform function for reading the column value.
   * This is used to handle nullable values, arrays, etc.
   */
  renderedReadTransform: ZodPgTransform;
  /**
   * The transform function for writing the column value.
   * This is used to serialize json, dates, etc.
   */
  renderedWriteTransform: ZodPgTransform;
}

export interface ZodPgEnum {
  constantName: string;
  typeName: string;
  values: string[];
}

export interface ZodPgImport {
  name: string;
  last: boolean;
}

export interface ZodPgTable {
  schemaName: string;
  tableName: string;
  tableSingularName: string;

  tableReadSchemaName?: string;
  tableInsertSchemaName?: string;
  tableUpdateSchemaName?: string;

  tableReadRecordName?: string;
  tableInsertRecordName?: string;
  tableUpdateRecordName?: string;

  description?: string;

  jsonSchemaImportLocation?: string;
  jsonSchemaImports?: ZodPgImport[];
  hasJsonSchemaImports: boolean;

  enums: ZodPgEnum[];
  readableColumns: ZodPgColumn[];
  writableColumns: ZodPgColumn[];
}

export type ZodPgProgress =
  | 'connecting'
  | 'fetchingSchema'
  | 'generating'
  | 'done';

export interface ZodPgConnectionConfig {
  port?: string;
  host?: string;
  database?: string;
  user?: string;
  password?: string;
  connectionString?: string;
  ssl?: boolean;
}

export type ZodPgCasing =
  | 'passthrough'
  | 'PascalCase'
  | 'camelCase'
  | 'snake_case'
  | 'kebab-case';

export type ZodPgColumnType =
  | 'email'
  | 'url'
  | 'string'
  | 'int'
  | 'number'
  | 'boolean'
  | 'date'
  | 'uuid'
  | 'json'
  | 'any';

export type ZodPgZodVersion = 3 | 4;

export interface ZodPgConfig {
  connection: ZodPgConnectionConfig;
  cleanOutput?: boolean;
  include?: string;
  exclude?: string;
  jsonSchemaImportLocation?: string;

  stringifyJson?: boolean;
  stringifyDates?: boolean;
  defaultEmptyArray?: boolean;

  zodVersion?: ZodPgZodVersion;

  fieldNameCasing?: ZodPgCasing;
  objectNameCasing?: ZodPgCasing;

  silent?: boolean;
  outputModule?: 'esm' | 'commonjs';
  outputDir: string;
  schemaName?: string;

  onColumnModelCreated?: (
    column: ZodPgColumn
  ) => ZodPgColumn | Promise<ZodPgColumn>;
  onTableModelCreated?: (table: ZodPgTable) => ZodPgTable | Promise<ZodPgTable>;
}

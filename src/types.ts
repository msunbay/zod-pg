/**
 * Represents the overall schema information for a PostgreSQL database schema.
 */
export interface ZodPgSchemaInfo {
  /** The name of the database schema (e.g., 'public') */
  name: string;
  /** Array of all tables found in the schema */
  tables: ZodPgTableInfo[];
}

/**
 * Represents basic information about a PostgreSQL table, view, or other relation.
 * This is the raw data structure before any processing or model creation.
 */
export interface ZodPgTableInfo {
  /** The type of relation (table, view, materialized view, etc.) */
  type: ZodPgTableType;
  /** The name of the table/relation */
  name: string;
  /** The schema name where this table resides */
  schemaName: string;
  /** Array of all columns in this table */
  columns: ZodPgColumnInfo[];
}

/**
 * Enum representing the different types of PostgreSQL relations that can be processed.
 */
export type ZodPgTableType =
  | 'table' // Regular table
  | 'view' // Database view
  | 'materialized_view' // Materialized view
  | 'foreign_table' // Foreign data wrapper table
  | 'unknown'; // Unknown or unsupported type

/**
 * Raw column information directly from PostgreSQL system catalogs.
 * This interface represents the unprocessed data about a database column.
 */
export interface ZodPgRawColumnInfo {
  /** The name of the column */
  name: string;
  /** The default value expression for the column, if any */
  defaultValue?: string;
  /** Whether the column allows NULL values */
  isNullable: boolean;
  /**
   * Whether the field is optional in the Zod schema
   * Defaults to the same as isNullable.
   */
  isOptional?: boolean;
  /** Maximum length constraint for string columns */
  maxLen?: number;
  /** Minimum length constraint for string columns */
  minLen?: number;
  /**
   * PostgreSQL type name from pg_type.typname. This is the actual type name used internally by PostgreSQL.
   *
   * Examples:
   * - Built-in types: 'varchar', 'int4', 'text', 'bool', 'timestamp', 'timestamptz', 'jsonb', 'uuid'
   * - Array types: '_text' (text[]), '_int4' (integer[]), '_varchar' (varchar[])
   * - Serial types: 'int4' with serial default, 'int8' with bigserial default
   * - Custom types: User-defined enum names, composite types, domain types
   *
   * This value is used by the type mapping system to determine the appropriate Zod schema type.
   * Array types are detected by the leading underscore prefix.
   */
  dataType: string;
  /** Name of the table this column belongs to */
  tableName: string;
  /** Name of the schema containing the table */
  schemaName: string;
  /** Column description/comment from the database */
  description?: string;
  /** Check constraints applied to this column */
  checkConstraints?: { checkClause: string }[];
  /** The type of table this column belongs to */
  tableType: ZodPgTableType;
}

/**
 * Enhanced column information with additional metadata derived from the raw column data.
 * This extends the raw column info with processed information about types and characteristics.
 */
export interface ZodPgColumnInfo extends ZodPgRawColumnInfo {
  /**
   * The mapped Zod type derived from the PostgreSQL dataType.
   *
   * This represents the high-level category that the PostgreSQL type maps to in the Zod schema system.
   * The type mapping logic analyzes the `dataType` field and converts it to one of these standardized types.
   *
   * Examples of mapping:
   * - 'varchar', 'text', 'bpchar' → 'string'
   * - 'int4', 'int8', 'smallint' → 'int'
   * - 'numeric', 'decimal', 'real' → 'number'
   * - 'bool' → 'boolean'
   * - 'timestamp', 'timestamptz', 'date' → 'date'
   * - 'uuid' → 'uuid'
   * - 'jsonb', 'json' → 'json'
   * - Email-like varchar columns → 'email' (if detected)
   * - URL-like varchar columns → 'url' (if detected)
   * - Unknown/unsupported types → 'any'
   *
   * This mapped type is used to generate the appropriate Zod schema (e.g., z.string(), z.number(), z.date()).
   */
  type: ZodPgColumnType;
  /** Whether this column represents an enumeration type */
  isEnum: boolean;
  /** Whether this column is a serial/auto-incrementing column */
  isSerial: boolean;
  /** Whether this column is an array type */
  isArray: boolean;
  /** If isEnum is true, contains the possible enum values */
  enumValues?: string[];
}

/**
 * Function type for Mustache template transforms.
 * Used to transform values during template rendering.
 */
type ZodPgTransform = () => (
  text: string,
  render: (text: string) => string
) => string;

/**
 * Base model for a column with additional processing and naming information.
 * This represents the column after initial processing but before final rendering.
 */
export interface ZodPgColumnBaseModel extends ZodPgColumnInfo {
  /**
   * The property name of the column in the generated Zod schema.
   * This is typically the column name transformed according to the specified casing (e.g., camelCase).
   */
  propertyName: string;
  /**
   * The name of the enum type for the column.
   * Used when the column is identified as an enum type through check constraints.
   * Example: 'UserStatus' for a status column with enum values.
   */
  enumTypeName?: string;
  /**
   * The constant name of the enum type for the column.
   * Used for generating enum constants in the constants file.
   * Example: 'USER_STATUS_ENUM' for a status column.
   */
  enumConstantName?: string;
  /**
   * The name of the JSON Zod schema for the column.
   * Used when the JSON schema import feature is enabled for JSON/JSONB columns.
   * Example: 'UserProfileSchema' for a profile column.
   */
  jsonSchemaName?: string;
  /**
   * Whether this column should be included in insert/update schemas.
   * Typically false for serial columns, primary keys, or other read-only columns.
   */
  isWritable: boolean;
  /**
   * Whether this property is marked as deprecated.
   * Can be used to generate @deprecated JSDoc comments.
   */
  isDeprecated?: boolean;
  /**
   * If isDeprecated is true, this provides the reason for deprecation.
   */
  isDeprecatedReason?: string;
}

/**
 * Final column model with fully rendered Zod types and transforms.
 * This represents the column after all processing and is ready for template generation.
 */
export interface ZodPgColumn extends ZodPgColumnBaseModel {
  /**
   * The fully rendered Zod type/schema for reading operations.
   * Example: 'z.string()', 'z.number().optional()', 'z.date()'
   */
  renderedReadType: string;
  /**
   * The fully rendered Zod type/schema for writing operations (insert/update).
   * May include additional constraints like max length, nullish handling, etc.
   * Example: 'z.string().max(100)', 'z.number().nullish()', 'z.string().email()'
   */
  renderedWriteType: string;
  /**
   * The transform function for reading column values from the database.
   * Handles nullable values, arrays, and other read-time transformations.
   */
  renderedReadTransform: ZodPgTransform;
  /**
   * The transform function for writing column values to the database.
   * Handles serialization of JSON, dates, and other write-time transformations.
   */
  renderedWriteTransform: ZodPgTransform;
}

/**
 * Represents a single value in an enumeration with rendering context.
 */
interface ZodPgEnumValue {
  /** The actual enum value */
  value: string;
  /** Whether this is the last value in the enum (used for template rendering) */
  last: boolean;
}

/**
 * Represents an enumeration type derived from check constraints.
 */
export interface ZodPgEnum {
  /** The constant name for the enum (e.g., 'USER_STATUS_ENUM') */
  constantName: string;
  /** The TypeScript type name for the enum (e.g., 'UserStatus') */
  typeName: string;
  /** Array of possible enum values */
  values: ZodPgEnumValue[];
}

/**
 * Represents an import statement with rendering context.
 */
export interface ZodPgImport {
  /** The name to import (e.g., 'UserProfileSchema') */
  name: string;
  /** Whether this is the last import in the list (used for template rendering) */
  last: boolean;
}

/**
 * Complete table model ready for template generation.
 * Contains all processed information needed to generate Zod schemas for a table or view.
 */
export interface ZodPgTable {
  /** The schema name where this table resides */
  schemaName: string;
  /** The type of relation (table, view, etc.) */
  type: ZodPgTableType;
  /** The original table name */
  tableName: string;
  /** The singular form of the table name (e.g., 'user' from 'users') */
  tableSingularName: string;

  /** Generated name for the read base schema (e.g., 'UserBaseSchema') */
  tableReadBaseSchemaName?: string;
  /** Generated name for the write base schema (e.g., 'UserWriteBaseSchema') */
  tableInsertBaseSchemaName?: string;
  /** Generated name for the read transform function (e.g., 'transformUserReadRecord') */
  tableReadTransformName?: string;
  /** Generated name for the insert transform function (e.g., 'transformUserInsertRecord') */
  tableInsertTransformName?: string;
  /** Generated name for the update transform function (e.g., 'transformUserUpdateRecord') */
  tableUpdateTransformName?: string;
  /** Generated name for the read schema (e.g., 'UserSchema') */
  tableReadSchemaName?: string;
  /** Generated name for the insert schema (e.g., 'UserInsertSchema') */
  tableInsertSchemaName?: string;
  /** Generated name for the update schema (e.g., 'UserUpdateSchema') */
  tableUpdateSchemaName?: string;

  /** Generated name for the base read record type (e.g., 'UserReadRecord') */
  tableReadBaseRecordName?: string;
  /** Generated name for the read record type (e.g., 'UserRecord') */
  tableReadRecordName?: string;
  /** Generated name for the base write record type (e.g., 'UserInsertBaseRecord') */
  tableInsertBaseRecordName?: string;
  /** Generated name for the insert record type (e.g., 'UserInsertRecord') */
  tableInsertRecordName?: string;
  /** Generated name for the base update record type (e.g., 'UserUpdateBaseRecord') */
  tableUpdateBaseRecordName?: string;
  /** Generated name for the update record type (e.g., 'UserUpdateRecord') */
  tableUpdateRecordName?: string;

  /** Optional description for the table schema */
  description?: string;

  /** Location to import JSON schemas from, if JSON schema feature is enabled */
  jsonSchemaImportLocation?: string;
  /** Array of JSON schema imports needed for this table */
  jsonSchemaImports?: ZodPgImport[];
  /** Whether this table has any JSON schema imports */
  hasJsonSchemaImports: boolean;

  /** Array of enum types found in this table */
  enums: ZodPgEnum[];
  /** Columns that should be included in read schemas */
  readableColumns: ZodPgColumn[];
  /** Columns that should be included in write (insert/update) schemas */
  writableColumns: ZodPgColumn[];
  /** Whether this table supports write operations (false for views, etc.) */
  isWritable: boolean;
}

/**
 * Progress states during schema generation process.
 */
export type ZodPgProgress =
  | 'connecting' // Establishing database connection
  | 'fetchingSchema' // Querying database metadata
  | 'generating' // Processing and generating schemas
  | 'done'; // Generation complete

/**
 * Configuration for PostgreSQL database connection.
 */
export interface ZodPgConnectionConfig {
  /** Database port (default: 5432) */
  port?: string;
  /** Database host (default: localhost) */
  host?: string;
  /** Database name to connect to */
  database?: string;
  /** Username for authentication */
  user?: string;
  /** Password for authentication */
  password?: string;
  /** Complete connection string (overrides individual connection params) */
  connectionString?: string;
  /** Whether to use SSL connection */
  ssl?: boolean;
}

/**
 * Available casing options for generated names.
 */
export type ZodPgCasing =
  | 'passthrough' // Keep original database naming
  | 'PascalCase' // FirstLetterUppercase
  | 'camelCase' // firstLetterLowercase
  | 'snake_case'; // all_lowercase_with_underscores

/**
 * Mapped Zod column types that PostgreSQL types are converted to.
 */
export type ZodPgColumnType =
  | 'email' // String with email validation
  | 'url' // String with URL validation
  | 'string' // Basic string type
  | 'int' // Integer number
  | 'number' // Decimal number
  | 'boolean' // Boolean value
  | 'date' // Date object
  | 'uuid' // String with UUID validation
  | 'json' // JSON object
  | 'unknown' // Unknown type
  | 'any'; // Any type (fallback)

/**
 * Supported Zod versions for code generation.
 */
export type ZodPgZodVersion = '3' | '4' | '4-mini';

/**
 * Main configuration interface for zod-pg schema generation.
 * This interface defines all available options for customizing the generation process.
 */
export interface ZodPgConfig {
  /** Database connection configuration */
  connection: ZodPgConnectionConfig;

  /** Whether to clean the output directory before generation */
  cleanOutput?: boolean;
  /** Regex pattern(s) to include only specific tables */
  include?: string | string[];
  /** Regex pattern(s) to exclude specific tables */
  exclude?: string | string[];
  /** Import location for JSON schemas (enables JSON schema feature) */
  jsonSchemaImportLocation?: string;

  /** Whether to stringify JSON values in write schemas */
  disableStringifyJson?: boolean;
  /** Whether to convert dates to ISO strings in write schemas */
  stringifyDates?: boolean;
  /** Whether to use z.coerce.date() instead of z.date() in read schemas */
  disableCoerceDates?: boolean;
  /** Whether to provide empty arrays as defaults for nullable array fields */
  defaultEmptyArray?: boolean;

  /** Target Zod version for generated code */
  zodVersion?: ZodPgZodVersion;

  /** Casing style for field names in generated schemas */
  fieldNameCasing?: ZodPgCasing;
  /** Casing style for object/type names in generated schemas */
  objectNameCasing?: ZodPgCasing;

  /** Whether to disable case transformations for generated schemas */
  disableCaseTransform?: boolean;

  /** Whether to suppress console output during generation */
  silent?: boolean;
  /** Module resolution strategy (affects import statements) */
  moduleResolution?: 'esm' | 'commonjs';
  /** Output directory for generated files */
  outputDir: string;
  /** Database schema name to process (default: 'public') */
  schemaName?: string;

  /**
   * Hook called for each column after initial model creation.
   * Allows customization of individual column properties and Zod types.
   */
  onColumnModelCreated?: (
    column: ZodPgColumn
  ) => ZodPgColumn | Promise<ZodPgColumn>;

  /**
   * Hook called for each table after all columns have been processed.
   * Allows customization of the entire table model.
   */
  onTableModelCreated?: (table: ZodPgTable) => ZodPgTable | Promise<ZodPgTable>;
}

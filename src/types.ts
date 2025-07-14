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

export interface ZodPgConfig {
  connection: ZodPgConnectionConfig;
  outputDir?: string;
  cleanOutput?: boolean;
  includeRegex?: string;
  excludeRegex?: string;
  jsonSchemaImportLocation?: string;
  silent?: boolean;
  outputModule?: 'esm' | 'commonjs';
  schemaName?: string;
}

export interface ZodPgParsedConnectionConfig {
  connectionString: string;
  ssl: boolean;
}

export interface ZodPgParsedConfig
  extends Omit<ZodPgConfig, 'excludeRegex' | 'includeRegex'> {
  connection: ZodPgParsedConnectionConfig;
  outputDir: string;
  schemaName: string;

  excludeRegex?: RegExp;
  includeRegex?: RegExp;
}

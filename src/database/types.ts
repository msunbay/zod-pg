import type { ZodPgColumnType } from '../types.js';

export interface ZodPgSchemaInfo {
  name: string;
  tables: ZodPgTableInfo[];
}

export interface ZodPgTableInfo {
  name: string;
  schemaName: string;
  columns: ZodPgColumnInfo[];
}

export interface ZodPgRawColumnInfo {
  name: string;
  dataType: string;
  defaultValue?: string;
  isNullable: boolean;
  maxLen?: number;
  minLen?: number;
  udtName: string;
  tableName: string;
  schemaName: string;
  description?: string;
  checkConstraints?: { checkClause: string }[];
}

export interface ZodPgColumnInfo extends ZodPgRawColumnInfo {
  zodType: ZodPgColumnType;
  isEnum: boolean;
  isSerial: boolean;
  isArray: boolean;
  enumValues?: string[];
}

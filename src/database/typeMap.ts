import { ZodPgColumnType } from '../types.js';
import { ZodPgRawColumnInfo } from './types.js';

// Map of Postgres udtName to Zod type
const UDT_TYPE_MAP: Record<string, string> = {
  // Numeric types
  int2: 'z.number().int()',
  int4: 'z.number().int()',
  int8: 'z.number().int()',
  float4: 'z.number()',
  float8: 'z.number()',
  numeric: 'z.number()',
  money: 'z.number()',
  serial: 'z.number().int()',
  serial4: 'z.number().int()',
  serial8: 'z.number().int()',
  bigserial: 'z.number().int()',

  // String types
  varchar: 'z.string()',
  bpchar: 'z.string()', // blank-padded char
  text: 'z.string()',
  name: 'z.string()',
  uuid: 'z.string().uuid()',

  // Boolean
  bool: 'z.boolean()',

  // Date/time
  timestamptz: 'z.coerce.date()',
  timestamp: 'z.coerce.date()',
  date: 'z.coerce.date()',
  time: 'z.string()',
  timetz: 'z.string()',

  // JSON
  jsonb: 'z.any()',
  json: 'z.any()',

  // Arrays (see below for dynamic handling)
  _text: 'z.array(z.string())',
  _int4: 'z.array(z.number().int())',
  _int8: 'z.array(z.number().int())',
  _uuid: 'z.array(z.string().uuid())',
  _bool: 'z.array(z.boolean())',
  _numeric: 'z.array(z.number())',
  _float4: 'z.array(z.number())',
  _float8: 'z.array(z.number())',
  _jsonb: 'z.array(z.any())',
  _json: 'z.array(z.any())',
  _timestamptz: 'z.array(z.date({ coerce: true }))',
  _timestamp: 'z.array(z.date({ coerce: true }))',
  _date: 'z.array(z.date({ coerce: true }))',
  _bpchar: 'z.array(z.string())',
  _varchar: 'z.array(z.string())',
  _name: 'z.array(z.string())',
};

export function mapColumnType(col: {
  udtName: string;
  dataType: string;
}): string {
  const { udtName, dataType } = col;

  // Handle enums (udtName is the enum type name, dataType is 'USER-DEFINED')
  if (dataType === 'USER-DEFINED') {
    // You may want to map this to a Zod enum elsewhere
    return 'z.string()';
  }

  // Handle arrays: udtName starts with _ (e.g., _text, _int4, _uuid)
  if (udtName.startsWith('_')) {
    if (UDT_TYPE_MAP[udtName]) {
      return UDT_TYPE_MAP[udtName];
    }
    // Fallback: array of any
    return 'z.array(z.any())';
  }

  // Normal types
  if (UDT_TYPE_MAP[udtName]) {
    return UDT_TYPE_MAP[udtName];
  }

  // Fallback for unknown types
  return 'z.any()';
}

export const isArrayType = (column: ZodPgRawColumnInfo): boolean => {
  // Check if the udtName starts with an underscore, indicating an array type
  return column.udtName.startsWith('_');
};

export const isSerialType = (column: ZodPgRawColumnInfo): boolean => {
  // Serial types in Postgres often have default values like nextval('sequence_name'::regclass)
  return (
    column.defaultValue?.toLowerCase().startsWith('nextval(') ||
    column.udtName === 'serial' ||
    column.udtName === 'serial4' ||
    column.udtName === 'serial8' ||
    column.udtName === 'bigserial'
  );
};

export const getZodType = (column: ZodPgRawColumnInfo): ZodPgColumnType => {
  // Normalize the udtName to handle variations
  const lowerUdtName = column.udtName.toLowerCase();

  const normalizedType = lowerUdtName.startsWith('_')
    ? lowerUdtName.slice(1) // Remove leading underscore for array types
    : lowerUdtName;

  switch (normalizedType) {
    case 'text':
    case 'varchar':
    case 'bpchar':
    case 'bytea':
    case 'inet':
    case 'cidr':
    case 'macaddr':
    case 'point':
    case 'polygon':
    case 'circle':
    case 'name':
    case 'time':
    case 'timetz':
      return 'string';
    case 'int2':
    case 'int4':
    case 'int8':
    case 'serial':
    case 'serial4':
    case 'serial8':
    case 'bigserial':
      return 'int';
    case 'float4':
    case 'float8':
    case 'numeric':
    case 'money':
      return 'number';
    case 'bool':
      return 'boolean';
    case 'timestamptz':
    case 'timestamp':
    case 'date':
      return 'date';
    case 'uuid':
      return 'uuid';
    case 'jsonb':
    case 'json':
      return 'json';
    default:
      // If the type is not recognized, return 'any'
      return 'any';
  }
};

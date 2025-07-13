import type { ColumnInfo } from './types';

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
  timestamptz: 'z.date({ coerce: true })',
  timestamp: 'z.date({ coerce: true })',
  date: 'z.date({ coerce: true })',
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

export function mapColumnType(col: ColumnInfo): string {
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

import { ZodPgColumnType, ZodPgRawColumnInfo } from '../types.js';

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

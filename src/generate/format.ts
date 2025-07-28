import pluralize from 'pluralize';

import { ZodPgCasing } from '../types.js';
import {
  convertCaseFormat,
  pascalCase,
  singularPascalCase,
  singularUpperCase,
  snakeCase,
} from '../utils/casing.js';
import { singularize } from '../utils/singularize.js';

const getOperationSuffix = (type: 'read' | 'insert' | 'update'): string => {
  switch (type) {
    case 'insert':
      return 'Insert';
    case 'update':
      return 'Update';
    default:
      return '';
  }
};

export const formatTableSchemaName = (
  tableName: string,
  type: 'read' | 'insert' | 'update',
  objectNameCasing: ZodPgCasing = 'PascalCase'
): string => {
  return `${convertCaseFormat(tableName, objectNameCasing)}Table${getOperationSuffix(type)}Schema`;
};

export const formatTableRecordName = (
  tableName: string,
  type: 'read' | 'insert' | 'update',
  objectNameCasing: ZodPgCasing = 'PascalCase'
): string => {
  return `${convertCaseFormat(singularize(tableName), objectNameCasing)}${getOperationSuffix(type)}Record`;
};

export const formatJsonSchemaName = (
  tableName: string,
  columnName: string,
  casing: ZodPgCasing = 'PascalCase'
): string => {
  return convertCaseFormat(
    `${singularPascalCase(tableName)}${pascalCase(columnName)}Schema`,
    casing
  );
};

export const formatEnumConstantName = (
  tableName: string,
  colName: string
): string => {
  return pluralize(
    `${singularUpperCase(tableName)}_${snakeCase(colName).toUpperCase()}`
  );
};

export const formatEnumTypeName = (
  tableName: string,
  colName: string,
  casing: ZodPgCasing = 'PascalCase'
): string => {
  return convertCaseFormat(
    `${singularPascalCase(tableName)}${pascalCase(colName)}`,
    casing
  );
};

import pluralize from 'pluralize';

import { ZodPgCasing, ZodPgTableInfo } from '../types.js';
import {
  convertCaseFormat,
  pascalCase,
  singularPascalCase,
  singularUpperCase,
  snakeCase,
} from '../utils/casing.js';
import { singularize } from '../utils/singularize.js';

const MVIEW_PREFIXES = ['mv_', 'mview_'];
const VIEW_PREFIXES = ['v_', 'view_'];

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

export const getSchemaPrefix = (tableInfo: ZodPgTableInfo): string => {
  switch (tableInfo.type) {
    case 'table':
    case 'foreign_table':
      return 'Table';
    case 'materialized_view':
      // If the table name starts with a known materialized view prefix, return an empty string
      // to avoid adding 'Mv' prefix unnecessarily.
      return MVIEW_PREFIXES.some((prefix) => tableInfo.name.startsWith(prefix))
        ? ''
        : 'Mv';
    case 'view':
      // If the table name starts with a known view prefix, return an empty string
      // to avoid adding 'View' prefix unnecessarily.
      return VIEW_PREFIXES.some((prefix) => tableInfo.name.startsWith(prefix))
        ? ''
        : 'View';
    default:
      return '';
  }
};

export const formatTableSchemaName = (
  tableInfo: ZodPgTableInfo,
  type: 'read' | 'insert' | 'update',
  objectNameCasing: ZodPgCasing = 'PascalCase'
): string => {
  return `${convertCaseFormat(tableInfo.name, objectNameCasing)}${getSchemaPrefix(tableInfo)}${getOperationSuffix(type)}Schema`;
};

export const formatTableRecordName = (
  tableInfo: ZodPgTableInfo,
  type: 'read' | 'insert' | 'update',
  objectNameCasing: ZodPgCasing = 'PascalCase'
): string => {
  return `${convertCaseFormat(singularize(tableInfo.name), objectNameCasing)}${getOperationSuffix(type)}Record`;
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

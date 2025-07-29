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

export const getTableType = (tableInfo: ZodPgTableInfo): string => {
  switch (tableInfo.type) {
    case 'table':
    case 'foreign_table':
      return 'Table';
    case 'materialized_view':
      return tableInfo.name.startsWith('mv_') ? '' : 'Mv';
    case 'view':
      return tableInfo.name.startsWith('v_') ||
        tableInfo.name.startsWith('view_')
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
  return `${convertCaseFormat(tableInfo.name, objectNameCasing)}${getTableType(tableInfo)}${getOperationSuffix(type)}Schema`;
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

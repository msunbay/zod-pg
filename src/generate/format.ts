import pluralize from 'pluralize';

import { ZodPgCasing, ZodPgTableInfo } from '../types.js';
import {
  convertCaseFormat,
  pascalCase,
  singularPascalCase,
  singularUpperCase,
  snakeCase,
} from '../utils/casing.js';

const MVIEW_PREFIXES = ['mv_', 'mview_'];
const VIEW_PREFIXES = ['v_', 'view_'];

export type Operation = 'read' | 'insert' | 'update' | 'write' | 'none';

const getOperationSuffix = (type: Operation): string => {
  switch (type) {
    case 'insert':
      return 'Insert';
    case 'update':
      return 'Update';
    case 'write':
      return 'Write';
    case 'read':
      return 'Read';
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

export const formaRecordTransformName = (
  tableInfo: ZodPgTableInfo,
  type: Operation,
  casing: ZodPgCasing = 'camelCase'
): string => {
  const name = `transform${singularPascalCase(tableInfo.name)}${getOperationSuffix(type)}Record`;
  return convertCaseFormat(name, casing);
};

export const formatTableSchemaBaseName = (
  tableInfo: ZodPgTableInfo,
  type: Operation,
  casing: ZodPgCasing = 'PascalCase'
): string => {
  const name = `${convertCaseFormat(tableInfo.name, 'PascalCase')}${getSchemaPrefix(tableInfo)}Base${getOperationSuffix(type)}Schema`;
  return convertCaseFormat(name, casing);
};

export const formatTableSchemaName = (
  tableInfo: ZodPgTableInfo,
  type: Operation,
  casing: ZodPgCasing = 'PascalCase'
): string => {
  const name = `${convertCaseFormat(tableInfo.name, 'PascalCase')}${getSchemaPrefix(tableInfo)}${getOperationSuffix(type)}Schema`;
  return convertCaseFormat(name, casing);
};

export const formatTableRecordName = ({
  tableInfo,
  operation,
  casing = 'PascalCase',
  suffix = 'Record',
}: {
  tableInfo: ZodPgTableInfo;
  operation: Operation;
  casing?: ZodPgCasing;
  suffix?: string;
}): string => {
  const name = `${singularPascalCase(tableInfo.name)}${getOperationSuffix(operation)}${suffix}`;
  return convertCaseFormat(name, casing);
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
    `${singularPascalCase(tableName)}${singularPascalCase(colName)}`,
    casing
  );
};

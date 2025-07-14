import { singularUpperCase, snakeCase } from './casing.js';

export const getEnumConstantName = (
  tableName: string,
  colName: string
): string => {
  const name = `${singularUpperCase(tableName)}_${snakeCase(
    colName
  ).toUpperCase()}`;

  if (name.endsWith('S')) return name;
  return `${name}S`;
};

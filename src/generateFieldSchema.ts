import type { ColumnInfo } from './types';

import { mapColumnType } from './typeMap';
import { getEnumConstantName, pascalCase, singularPascalCase } from './utils';

export const getEnums = (
  tableName: string,
  enumConstraints: Record<string, string[]>
) => {
  const enumLiterals: string[] = [];
  const enumTypes: string[] = [];

  for (const colName in enumConstraints) {
    const enumName = getEnumConstantName(tableName, colName);

    enumLiterals.push(
      `export const ${enumName} = ${JSON.stringify(
        enumConstraints[colName]
      )} as const;`
    );

    enumTypes.push(
      `export type ${singularPascalCase(
        enumName
      )} = (typeof ${enumName})[number];`
    );
  }

  return { enumLiterals, enumTypes };
};

interface CreateSchemaFieldsParams {
  columns: ColumnInfo[];
  tableName: string;
  enumConstraints: Record<string, string[]>;
  useJsonSchemaImports: boolean;
}

interface CreateFieldTypeParams {
  tableName: string;
  column: ColumnInfo;
  includeConstraints: boolean;
  enumConstraints: Record<string, string[]>;
  useJsonSchemaImports: boolean;
}

const createFieldType = ({
  tableName,
  column,
  includeConstraints,
  enumConstraints,
  useJsonSchemaImports,
}: CreateFieldTypeParams): string => {
  let zodType: string;

  if (enumConstraints[column.name]) {
    const enumName = getEnumConstantName(tableName, column.name);

    if (
      column.dataType === '_text' ||
      column.dataType === 'ARRAY' ||
      column.udtName === '_text'
    ) {
      zodType = `z.array(z.enum(${enumName}))`;
    } else {
      zodType = `z.enum(${enumName})`;
    }
  } else {
    zodType = mapColumnType(column, tableName);

    if (column.dataType === 'jsonb' && useJsonSchemaImports) {
      zodType = `json.${singularPascalCase(tableName)}${pascalCase(
        column.name
      )}Schema`;
    }
  }

  if (includeConstraints && column.maxLen) {
    zodType = `${zodType}.max(${column.maxLen})`;
  }

  if (zodType === 'z.any()')
    console.warn(
      `No mapping found for type: ${tableName}.${column.name}:${column.dataType}. Defaulting to z.any()`,
      { column }
    );

  if (column.isNullable === 'YES') {
    zodType = `${zodType}.nullable().optional()`;
  }

  return zodType;
};

export const createOutputSchemaFields = ({
  columns,
  ...params
}: CreateSchemaFieldsParams) =>
  columns
    .map((column) => {
      let zodType = createFieldType({
        ...params,
        column,
        includeConstraints: false,
      });

      if (column.isNullable === 'YES') {
        zodType = `${zodType}.transform(val => (val === null ? undefined : val))`;
      }

      return `  ${column.name}: ${zodType},`;
    })
    .join('\n');

export const createInputSchemaFields = ({
  columns,
  ...params
}: CreateSchemaFieldsParams) =>
  columns
    .filter((column) => column.name !== 'id')
    .map((column) => {
      let zodType = createFieldType({
        column,
        ...params,
        includeConstraints: true,
      });

      if (column.dataType === 'jsonb') {
        zodType =
          column.isNullable === 'YES'
            ? `${zodType}.transform(val => val ? JSON.stringify(val) : null)`
            : `${zodType}.transform(val => JSON.stringify(val))`;
      }

      return `  ${column.name}: ${zodType},`;
    })
    .join('\n');

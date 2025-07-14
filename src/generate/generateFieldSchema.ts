import type { ColumnInfo, TableInfo } from '../database/types';

import { mapColumnType } from '../database/typeMap';
import { getEnumConstantName, pascalCase, singularPascalCase } from '../utils';

export const getEnums = (table: TableInfo) => {
  const enumLiterals: string[] = [];
  const enumTypes: string[] = [];

  for (const column of table.columns) {
    if (!column.allowedValues?.length) continue;

    const enumName = getEnumConstantName(table.name, column.name);

    enumLiterals.push(
      `export const ${enumName} = ${JSON.stringify(column.allowedValues)} as const;`
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
  table: TableInfo;
  useJsonSchemaImports: boolean;
}

interface CreateFieldTypeParams {
  column: ColumnInfo;
  includeConstraints: boolean;
  useJsonSchemaImports: boolean;
}

const createFieldType = ({
  column,
  includeConstraints,
  useJsonSchemaImports,
}: CreateFieldTypeParams): string => {
  let zodType: string;

  if (column.allowedValues?.length) {
    const enumName = getEnumConstantName(column.tableName, column.name);

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
    zodType = mapColumnType(column);

    if (column.dataType === 'jsonb' && useJsonSchemaImports) {
      zodType = `json.${singularPascalCase(column.tableName)}${pascalCase(
        column.name
      )}Schema`;
    }
  }

  if (includeConstraints && column.maxLen && !column.allowedValues) {
    zodType = `${zodType}.max(${column.maxLen})`;
  }

  if (column.isNullable) {
    zodType = `${zodType}.nullable().optional()`;
  }

  return zodType;
};

export const createOutputSchemaFields = ({
  table,
  ...params
}: CreateSchemaFieldsParams) =>
  table.columns
    .map((column) => {
      let zodType = createFieldType({
        ...params,
        column,
        includeConstraints: false,
      });

      if (column.isNullable) {
        zodType = `${zodType}.transform(val => (val === null ? undefined : val))`;
      }

      return `  ${column.name}: ${zodType},`;
    })
    .join('\n');

export const createInputSchemaFields = ({
  table,
  ...params
}: CreateSchemaFieldsParams) =>
  table.columns
    .filter((column) => !column.isSerial) // Exclude serial columns
    .map((column) => {
      let zodType = createFieldType({
        column,
        ...params,
        includeConstraints: true,
      });

      if (column.dataType === 'jsonb') {
        zodType = column.isNullable
          ? `${zodType}.transform(val => val ? JSON.stringify(val) : null)`
          : `${zodType}.transform(val => JSON.stringify(val))`;
      }

      return `  ${column.name}: ${zodType},`;
    })
    .join('\n');

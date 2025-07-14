import { promises } from 'fs';

import type { TableInfo } from '../database/types.js';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgParsedConfig } from '../types.js';
import { logWarning, pascalCase, singularPascalCase } from '../utils/index.js';
import {
  createInputSchemaFields,
  createOutputSchemaFields,
  getEnums,
} from './generateFieldSchema.js';

export async function generateTableSchema(
  table: TableInfo,
  { outputDir, jsonSchemaImportLocation }: ZodPgParsedConfig
) {
  if (table.columns.length === 0) {
    logWarning(`No columns found for table: ${table.name}`);
    return;
  }

  const useJsonSchemaImports =
    !!jsonSchemaImportLocation &&
    table.columns.some((col) => col.dataType === 'jsonb');

  const { enumLiterals, enumTypes } = getEnums(table);

  const schema = `${GENERATED_HEADER_COMMENT}\nimport { z } from 'zod';
${
  useJsonSchemaImports
    ? `import * as json from '${jsonSchemaImportLocation}';\n`
    : ''
}
${
  enumLiterals.length
    ? `
${enumLiterals.join('\n')}\n`
    : ''
}
export const ${pascalCase(table.name)}TableInsertSchema = z.object({
${createInputSchemaFields({ table, useJsonSchemaImports })}
});

export const ${pascalCase(table.name)}TableSchema = z.object({
${createOutputSchemaFields({ table, useJsonSchemaImports })}
});

export const ${pascalCase(table.name)}TableUpdateSchema = ${pascalCase(
    table.name
  )}TableInsertSchema.partial();

export type ${singularPascalCase(
    table.name
  )}Record = z.infer<typeof ${pascalCase(table.name)}TableSchema>;
export type ${singularPascalCase(
    table.name
  )}InsertRecord = z.input<typeof ${pascalCase(table.name)}TableInsertSchema>;
export type ${singularPascalCase(
    table.name
  )}UpdateRecord = z.input<typeof ${pascalCase(table.name)}TableUpdateSchema>;
${enumTypes ? `${enumTypes.join('\n')}` : ''}`;

  const fileName = `${outputDir}/tables/${table.name}.ts`;
  await promises.writeFile(fileName, schema);
}

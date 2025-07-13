import { promises } from 'fs';

import { GENERATED_HEADER_COMMENT } from '../constants';
import { TableInfo } from '../database/types';
import { logWarning, pascalCase, singularPascalCase } from '../utils';
import {
  createInputSchemaFields,
  createOutputSchemaFields,
  getEnums,
} from './generateFieldSchema';

export async function generateTableSchema({
  table,
  outputDir,
  jsonSchemaImportLocation,
}: {
  table: TableInfo;
  outputDir: string;
  jsonSchemaImportLocation?: string;
}) {
  if (table.columns.length === 0) {
    logWarning(`No columns found for table: ${table.name}`);
    return;
  }

  const useJsonSchemaImports =
    !!jsonSchemaImportLocation &&
    table.columns.some((col) => col.dataType === 'jsonb');

  const { enumLiterals, enumTypes } = getEnums(table);

  const schema = `import { z } from 'zod';
${
  useJsonSchemaImports
    ? `import * as json from '${jsonSchemaImportLocation}';\n`
    : ''
}
${GENERATED_HEADER_COMMENT}
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
${enumTypes.join('\n')}

`;

  const fileName = `${outputDir}/tables/${table.name}.ts`;
  await promises.writeFile(fileName, schema);
}

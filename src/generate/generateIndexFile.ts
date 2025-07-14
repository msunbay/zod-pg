import { promises } from 'fs';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { SchemaInfo } from '../database/types.js';
import { ZodPgParsedConfig } from '../types.js';

export const generateTablesIndexFile = async (
  schema: SchemaInfo,
  {
    outputDir,
    outputModule,
  }: Pick<ZodPgParsedConfig, 'outputDir' | 'outputModule'>
) => {
  const indexContent = schema.tables
    .map(({ name }) => {
      if (outputModule === 'esm') return `export * from './${name}.js';`;
      else return `export * from './${name}';`;
    })
    .join('\n');

  const filePath = `${outputDir}/tables/index.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\n${indexContent}\n`
  );
};

import { promises } from 'fs';

import type { SchemaInfo } from '../database/types.js';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgParsedConfig } from '../types.js';

export const generateConstantsFile = async (
  schema: SchemaInfo,
  { outputDir }: Pick<ZodPgParsedConfig, 'outputDir'>
) => {
  const consts = schema.tables
    .map(({ name }) => `export const TABLE_${name.toUpperCase()} = '${name}';`)
    .join('\n');

  const filePath = `${outputDir}/constants.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\n${consts}\n`
  );
};

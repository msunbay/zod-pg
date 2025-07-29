import { promises } from 'fs';

import type { ZodPgSchemaInfo } from '../types.js';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgConfig } from '../types.js';
import { logDebug } from '../utils/debug.js';

export const generateConstantsFile = async (
  schema: ZodPgSchemaInfo,
  { outputDir }: Pick<ZodPgConfig, 'outputDir'>
) => {
  const consts = schema.tables
    .map(({ name }) => `export const TABLE_${name.toUpperCase()} = '${name}';`)
    .join('\n');

  const filePath = `${outputDir}/constants.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\n${consts}\n`
  );

  logDebug(`Generated "${filePath}" file`);
};

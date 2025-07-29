import { promises } from 'fs';

import type { ZodPgSchemaInfo } from '../types.js';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgConfig } from '../types.js';
import { logDebug } from '../utils/debug.js';
import { getTableType } from './format.js';

export const generateConstantsFile = async (
  schema: ZodPgSchemaInfo,
  { outputDir }: Pick<ZodPgConfig, 'outputDir'>
) => {
  const consts = schema.tables
    .map((info) => {
      const prefix = getTableType(info).toUpperCase();
      const upperName = info.name.toUpperCase();
      const constantName = prefix ? `${prefix}_${upperName}` : upperName;

      return `export const ${constantName} = '${info.name}';`;
    })
    .join('\n');

  const filePath = `${outputDir}/constants.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\n${consts}\n`
  );

  logDebug(`Generated "${filePath}" file`);
};

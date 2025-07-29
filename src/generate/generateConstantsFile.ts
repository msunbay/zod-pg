import { promises } from 'fs';

import type { ZodPgSchemaInfo, ZodPgTableType } from '../types.js';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgConfig } from '../types.js';
import { logDebug } from '../utils/debug.js';

const getTablePrefix = (type: ZodPgTableType): string => {
  switch (type) {
    case 'table':
    case 'foreign_table':
      return 'TABLE_';
    case 'materialized_view':
      return 'MV_';
    case 'view':
      return 'VIEW_';
    default:
      return 'UNKNOWN_';
  }
};

export const generateConstantsFile = async (
  schema: ZodPgSchemaInfo,
  { outputDir }: Pick<ZodPgConfig, 'outputDir'>
) => {
  const consts = schema.tables
    .map(
      ({ name, type }) =>
        `export const ${getTablePrefix(type)}_${name.toUpperCase()} = '${name}';`
    )
    .join('\n');

  const filePath = `${outputDir}/constants.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\n${consts}\n`
  );

  logDebug(`Generated "${filePath}" file`);
};

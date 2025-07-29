import { promises } from 'fs';

import type { ZodPgSchemaInfo } from '../types.js';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgConfig } from '../types.js';
import { logDebug } from '../utils/debug.js';

export const generateTypesFile = async (
  schema: ZodPgSchemaInfo,
  { outputDir }: Pick<ZodPgConfig, 'outputDir'>
) => {
  const types = schema.tables
    .filter((table) => table.type === 'table')
    .map(({ name }) => `  | '${name}'`)
    .join('\n');

  const filePath = `${outputDir}/types.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\nexport type Table = \n${types};\n`
  );

  logDebug(`Generated "${filePath}" file`);
};

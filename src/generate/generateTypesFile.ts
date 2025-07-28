import { promises } from 'fs';

import type { ZodPgSchemaInfo } from '../database/types.js';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgConfig } from '../types.js';

export const generateTypesFile = async (
  schema: ZodPgSchemaInfo,
  { outputDir }: Pick<ZodPgConfig, 'outputDir'>
) => {
  const types = schema.tables.map(({ name }) => `  | '${name}'`).join('\n');

  const filePath = `${outputDir}/types.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\nexport type Table = \n${types};\n`
  );
};

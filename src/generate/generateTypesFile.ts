import { promises } from 'fs';

import type { SchemaInfo } from '../database/types.js';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgParsedConfig } from '../types.js';

export const generateTypesFile = async (
  schema: SchemaInfo,
  { outputDir }: Pick<ZodPgParsedConfig, 'outputDir'>
) => {
  const types = schema.tables.map(({ name }) => `  | '${name}'`).join('\n');

  const filePath = `${outputDir}/types.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\nexport type Table = \n${types};\n`
  );
};

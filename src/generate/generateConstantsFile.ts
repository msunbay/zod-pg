import { promises } from 'fs';

import { GENERATED_HEADER_COMMENT } from '../constants';
import { SchemaInfo } from '../database/types';

export const generateConstantsFile = async (
  outputPath: string,
  schema: SchemaInfo
) => {
  const consts = schema.tables
    .map(({ name }) => `export const TABLE_${name.toUpperCase()} = '${name}';`)
    .join('\n');

  const filePath = `${outputPath}/constants.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\n${consts}\n`
  );
};

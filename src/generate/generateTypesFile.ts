import { promises } from 'fs';

import { GENERATED_HEADER_COMMENT } from '../constants';
import { SchemaInfo } from '../database/types';

export const generateTypesFile = async (
  outputPath: string,
  schema: SchemaInfo
) => {
  const types = schema.tables.map(({ name }) => `  | '${name}'`).join('\n');

  const filePath = `${outputPath}/types.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\nexport type Table = \n${types};\n`
  );
};

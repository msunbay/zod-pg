import { promises } from 'fs';

import { GENERATED_HEADER_COMMENT } from '../constants';
import { SchemaInfo } from '../database/types';

export const generateTablesIndexFile = async (
  outputPath: string,
  schema: SchemaInfo
) => {
  const indexContent = schema.tables
    .map(({ name }) => `export * from './${name}';`)
    .join('\n');

  const filePath = `${outputPath}/tables/index.ts`;
  await promises.writeFile(filePath, indexContent);

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\n${indexContent}\n`
  );
};

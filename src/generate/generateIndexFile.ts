import { promises } from 'fs';

import { GENERATED_HEADER_COMMENT } from '../constants.js';
import { ZodPgConfig, ZodPgSchemaInfo, ZodPgTableType } from '../types.js';
import { logDebug } from '../utils/debug.js';
import { getOutputFolder } from '../utils/fs.js';

const generateSchemasIndexFile = async (
  schema: ZodPgSchemaInfo,
  type: ZodPgTableType,
  { outputDir, outputModule }: Pick<ZodPgConfig, 'outputDir' | 'outputModule'>
) => {
  const indexContent = schema.tables
    .filter((table) => table.type === type)
    .map(({ name }) => {
      if (outputModule === 'esm') return `export * from './${name}.js';`;
      else return `export * from './${name}';`;
    })
    .join('\n');

  if (indexContent.length === 0) {
    logDebug(
      `No ${type} found in schema '${schema.name}' to generate index file.`
    );
    return;
  }

  const filePath = `${outputDir}/${getOutputFolder(type)}/index.ts`;

  await promises.writeFile(
    filePath,
    `${GENERATED_HEADER_COMMENT}\n${indexContent}\n`
  );

  logDebug(`Generated "${filePath}" file`);
};

export const generateSchemasIndexFiles = async (
  schema: ZodPgSchemaInfo,
  config: ZodPgConfig
): Promise<void> => {
  await generateSchemasIndexFile(schema, 'table', config);
  await generateSchemasIndexFile(schema, 'view', config);
  await generateSchemasIndexFile(schema, 'materialized_view', config);
  await generateSchemasIndexFile(schema, 'foreign_table', config);
  await generateSchemasIndexFile(schema, 'unknown', config);
};

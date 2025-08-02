import { promises } from 'fs';

import { ZodPgConfig, ZodPgSchemaInfo, ZodPgTableType } from '../types.js';
import { logDebug } from '../utils/debug.js';
import { getOutputFolder } from '../utils/fs.js';
import { renderTemplate } from './template.js';

const generateSchemasIndexFile = async (
  schema: ZodPgSchemaInfo,
  type: ZodPgTableType,
  {
    outputDir,
    moduleResolution,
  }: Pick<ZodPgConfig, 'outputDir' | 'moduleResolution'>
) => {
  const exports = schema.tables
    .filter((table) => table.type === type)
    .map(({ name }) => ({
      fileName: moduleResolution === 'esm' ? `${name}.js` : name,
    }));

  if (exports.length === 0) {
    logDebug(
      `No ${type} found in schema '${schema.name}' to generate index file.`
    );

    return;
  }

  const content = await renderTemplate('index', { exports });

  const filePath = `${outputDir}/${getOutputFolder(type)}/index.ts`;

  await promises.writeFile(filePath, content, 'utf8');

  logDebug(`Generated "${filePath}" file`);
};

export const generateIndexFiles = async (
  schema: ZodPgSchemaInfo,
  config: ZodPgConfig
): Promise<void> => {
  await generateSchemasIndexFile(schema, 'table', config);
  await generateSchemasIndexFile(schema, 'view', config);
  await generateSchemasIndexFile(schema, 'materialized_view', config);
  await generateSchemasIndexFile(schema, 'foreign_table', config);
  await generateSchemasIndexFile(schema, 'unknown', config);
};

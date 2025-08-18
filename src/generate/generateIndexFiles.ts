import { promises } from 'fs';

import { ZodPgConfig, ZodPgTable, ZodPgTableType } from '../types.js';
import { logDebug } from '../utils/debug.js';
import { getOutputFolder } from '../utils/fs.js';
import { renderTemplate } from './template.js';

const generateSchemasIndexFile = async (
  models: ZodPgTable[],
  type: ZodPgTableType,
  {
    outputDir,
    moduleResolution,
  }: Pick<ZodPgConfig, 'outputDir' | 'moduleResolution'>
) => {
  const exports = models
    .filter((table) => table.type === type)
    .map((table) => ({
      ...table,
      fileName:
        moduleResolution === 'esm'
          ? `${table.tableName}/index.js`
          : table.tableName,
    }));

  if (exports.length === 0) {
    logDebug(`No ${type} found in schema to generate index file.`);

    return;
  }

  const content = await renderTemplate('index', { exports });

  const filePath = `${outputDir}/${getOutputFolder(type)}/index.ts`;

  await promises.writeFile(filePath, content, 'utf8');

  logDebug(`Generated "${filePath}" file`);
};

export const generateIndexFiles = async (
  models: ZodPgTable[],
  config: ZodPgConfig
): Promise<void> => {
  await generateSchemasIndexFile(models, 'table', config);
  await generateSchemasIndexFile(models, 'view', config);
  await generateSchemasIndexFile(models, 'materialized_view', config);
  await generateSchemasIndexFile(models, 'foreign_table', config);
  await generateSchemasIndexFile(models, 'unknown', config);
};

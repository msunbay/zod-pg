import { promises } from 'fs';

import type { ZodPgConfig, ZodPgTable } from '../types.js';

import {
  ensureFolder,
  getOutputFolder,
  logDebug,
  logWarning,
} from '../utils/index.js';
import { renderTemplate } from './template.js';

async function generateSchemaFile(
  table: ZodPgTable,
  config: ZodPgConfig
): Promise<void> {
  logDebug(`Generating schema for: ${table.type} ${table.tableName}`);

  if (table.readableColumns.length === 0) {
    logWarning(`No columns found for ${table.type} ${table.tableName}`);
    return;
  }

  const output = await renderTemplate('schema', table);

  const folderPath = `${config.outputDir}/${getOutputFolder(table.type)}/${table.tableName}`;
  await ensureFolder(folderPath);

  const fileName = `${folderPath}/schema.ts`;
  await promises.writeFile(fileName, output, 'utf8');

  logDebug(`Generated "${fileName}"`);
}

async function generateSchemaIndexFile(
  table: ZodPgTable,
  config: ZodPgConfig
): Promise<void> {
  logDebug(
    `Generating schema index file for: ${table.type} ${table.tableName}`
  );

  if (table.readableColumns.length === 0) {
    logWarning(`No columns found for ${table.type} ${table.tableName}`);
    return;
  }

  const output = await renderTemplate('schema-index', {
    ...table,
    fileName: config.moduleResolution === 'esm' ? `schema.js` : 'schema',
  });

  const folderPath = `${config.outputDir}/${getOutputFolder(table.type)}/${table.tableName}`;
  await ensureFolder(folderPath);

  const fileName = `${folderPath}/index.ts`;
  await promises.writeFile(fileName, output, 'utf8');

  logDebug(`Generated "${fileName}"`);
}

export async function generateSchemaFiles(
  table: ZodPgTable,
  config: ZodPgConfig
): Promise<void> {
  await generateSchemaFile(table, config);
  await generateSchemaIndexFile(table, config);
}

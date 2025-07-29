import { promises } from 'fs';

import type { ZodPgConfig, ZodPgTableInfo } from '../types.js';

import {
  ensureFolder,
  getOutputFolder,
  logDebug,
  logWarning,
} from '../utils/index.js';
import { createTableModel } from './models.js';
import { renderTemplate } from './template.js';

export async function generateSchemaFile(
  tableInfo: ZodPgTableInfo,
  config: ZodPgConfig
): Promise<void> {
  logDebug(`Generating schema for: ${tableInfo.type} ${tableInfo.name}`);

  const table = await createTableModel(tableInfo, config);

  if (table.readableColumns.length === 0) {
    logWarning(`No columns found for ${tableInfo.type} ${table.tableName}`);
    return;
  }

  const output = await renderTemplate('tables', table);

  const folderPath = `${config.outputDir}/${getOutputFolder(tableInfo.type)}`;
  await ensureFolder(folderPath);

  const fileName = `${folderPath}/${table.tableName}.ts`;
  await promises.writeFile(fileName, output);

  logDebug(`Generated "${fileName}"`);
}

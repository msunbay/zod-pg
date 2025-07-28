import { promises } from 'fs';

import type { ZodPgTableInfo } from '../database/types.js';
import type { ZodPgConfig } from '../types.js';

import { logWarning } from '../utils/index.js';
import { createTableModel } from './models.js';
import { renderTemplate } from './template.js';

export async function generateTableSchema(
  tableInfo: ZodPgTableInfo,
  config: ZodPgConfig
): Promise<void> {
  const table = await createTableModel(tableInfo, config);

  if (table.readableColumns.length === 0) {
    logWarning(`No columns found for table: ${table.tableName}`);
    return;
  }

  const output = await renderTemplate('tables', table);

  const fileName = `${config.outputDir}/tables/${table.tableName}.ts`;
  await promises.writeFile(fileName, output);
}

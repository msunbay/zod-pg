import { promises } from 'fs';

import type { ZodPgSchemaInfo } from '../types.js';

import { ZodPgConfig } from '../types.js';
import { logDebug } from '../utils/debug.js';
import { renderTemplate } from './template.js';

export const generateTypesFile = async (
  schema: ZodPgSchemaInfo,
  { outputDir }: Pick<ZodPgConfig, 'outputDir'>
) => {
  const tables = schema.tables.filter((table) => table.type === 'table');
  const views = schema.tables.filter((table) => table.type === 'view');
  const materializedViews = schema.tables.filter(
    (table) => table.type === 'materialized_view'
  );
  const foreignTables = schema.tables.filter(
    (table) => table.type === 'foreign_table'
  );

  const content = await renderTemplate('types', {
    tables,
    views,
    materializedViews,
    foreignTables,
    hasTables: tables.length > 0,
    hasViews: views.length > 0,
    hasMaterializedViews: materializedViews.length > 0,
    hasForeignTables: foreignTables.length > 0,
  });

  const filePath = `${outputDir}/types.ts`;

  await promises.writeFile(filePath, content, 'utf8');

  logDebug(`Generated "${filePath}" file`);
};

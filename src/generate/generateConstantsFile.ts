import { promises } from 'fs';

import type { ZodPgSchemaInfo } from '../types.js';

import { ZodPgConfig } from '../types.js';
import { logDebug } from '../utils/debug.js';
import { getSchemaPrefix } from './format.js';
import { renderTemplate } from './template.js';

export const generateConstantsFile = async (
  schema: ZodPgSchemaInfo,
  { outputDir }: Pick<ZodPgConfig, 'outputDir'>
) => {
  const constants = schema.tables.map((info) => {
    const prefix = getSchemaPrefix(info).toUpperCase();
    const upperName = info.name.toUpperCase();
    const constantName = prefix ? `${prefix}_${upperName}` : upperName;

    return { name: constantName, value: info.name };
  });

  const filePath = `${outputDir}/constants.ts`;

  const content = await renderTemplate('constants', { constants });

  await promises.writeFile(filePath, content, 'utf8');

  logDebug(`Generated "${filePath}" file`);
};

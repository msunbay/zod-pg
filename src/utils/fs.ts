import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';

import { logDebug } from './debug.js';

/**
 * Deletes all .ts files in the output tables folder.
 */
export function clearTablesDirectory(outputPath: string) {
  const tablesPath = `${outputPath}/tables`;

  const files = readdirSync(tablesPath);

  for (const file of files) {
    if (file.endsWith('.ts')) {
      unlinkSync(`${tablesPath}/${file}`);
    }
  }

  if (files.length > 0) {
    logDebug(`Deleted all .ts files in ${tablesPath}`);
  }
}

export function ensureOutputDirectories(outputPath: string) {
  const tablesPath = `${outputPath}/tables`;

  const exists = existsSync(tablesPath);

  if (!exists) {
    mkdirSync(tablesPath, { recursive: true });
  }
}

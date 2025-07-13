import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';

import { toError } from './error';
import { logError, logSuccess } from './logger';

/**
 * Deletes all .ts files in the output tables folder.
 */
export function clearTablesDirectory(outputPath: string) {
  const tablesPath = `${outputPath}/tables`;

  try {
    const files = readdirSync(tablesPath);

    for (const file of files) {
      if (file.endsWith('.ts')) {
        unlinkSync(`${tablesPath}/${file}`);
      }
    }

    if (files.length > 0) {
      logSuccess(`Deleted all .ts files in ${tablesPath}`);
    }
  } catch (err) {
    logError(`Error cleaning output folder: ${toError(err).message}`);
  }
}

export function ensureOutputDirectories(outputPath: string) {
  const tablesPath = `${outputPath}/tables`;

  const exists = existsSync(tablesPath);

  if (!exists) {
    mkdirSync(tablesPath, { recursive: true });
  }
}

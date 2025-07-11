import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { toError } from "./error";

/**
 * Deletes all .ts files in the output tables folder.
 */
export function clearTablesDirectory(outputPath: string) {
  const tablesPath = `${outputPath}/tables`;

  try {
    const exists = existsSync(tablesPath);

    if (!exists) {
      mkdirSync(tablesPath, { recursive: true });
    }

    const files = readdirSync(tablesPath);

    for (const file of files) {
      if (file.endsWith(".ts")) {
        unlinkSync(`${tablesPath}/${file}`);
      }
    }

    if (files.length > 0) {
      console.log(`Deleted all .ts files in ${tablesPath}`);
    }
  } catch (err) {
    console.error(`Error cleaning output folder: ${toError(err).message}`);
  }
}

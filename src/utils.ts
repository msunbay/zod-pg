import { readdirSync, unlinkSync } from "fs";
import camelCase from "lodash-es/camelCase";
import upperFirst from "lodash-es/upperFirst";
import snakeCase from "lodash-es/snakeCase";

// Dummy tagged template literal for SQL queries
// This is used to allow for syntax highlighting in IDEs.
export const sql = String.raw;

export const pascalCase = (str: string): string => upperFirst(camelCase(str));

export const singularUpperCase = (tableName: string): string => {
  return snakeCase(tableName)
    .toUpperCase()
    .split("_")
    .map((part) => (part.endsWith("S") ? part.slice(0, -1) : part))
    .join("_");
};

export const singularPascalCase = (tableName: string): string => {
  return pascalCase(singularUpperCase(tableName));
};

export const getEnumConstantName = (
  tableName: string,
  colName: string
): string => {
  const name = `${singularUpperCase(tableName)}_${snakeCase(
    colName
  ).toUpperCase()}`;
  if (name.endsWith("S")) return name;
  return `${name}S`;
};

/**
 * Deletes all .ts files in the output schema folder.
 */
export function clearOutputDirectory() {
  const OUTPUT_PATH = "./app/database/schema/tables";

  try {
    const files = readdirSync(OUTPUT_PATH);

    for (const file of files) {
      if (file.endsWith(".ts")) {
        unlinkSync(`${OUTPUT_PATH}/${file}`);
      }
    }

    console.log(`Deleted all .ts files in ${OUTPUT_PATH}`);
  } catch (err) {
    console.error(`Error cleaning output folder:`, err);
  }
}

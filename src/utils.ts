import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { camelCase, upperFirst, snakeCase } from "lodash";

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
export function clearOutputDirectory(outputPath: string) {
  try {
    const exists = existsSync(outputPath);

    if (!exists) {
      mkdirSync(outputPath);
    }

    const files = readdirSync(outputPath);

    for (const file of files) {
      if (file.endsWith(".ts")) {
        unlinkSync(`${outputPath}/${file}`);
      }
    }

    if (files.length > 0) {
      console.log(`Deleted all .ts files in ${outputPath}`);
    }
  } catch (err) {
    console.error(`Error cleaning output folder: ${toError(err).message}`);
  }
}

export const ensureEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
};

export const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
};

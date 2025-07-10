import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";

export function camelCase(str: string): string {
  return str
    .replace(/[_-]+/g, " ")
    .replace(/(?:^|\s)(\w)/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/\s+/g, "")
    .replace(/^(.)/, (m) => m.toLowerCase());
}

export function upperFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

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
  // Singularize each part, then PascalCase each part, handling uppercase input
  return tableName
    .split(/_|-|\s+/)
    .map((part) => part.toLowerCase())
    .map((part) => (part.endsWith("s") ? part.slice(0, -1) : part))
    .map((part) => upperFirst(camelCase(part)))
    .join("");
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

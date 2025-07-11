import { singularize } from "./singularize";

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

export const pascalCase = (str: string): string => upperFirst(camelCase(str));

export const singularUpperCase = (tableName: string): string => {
  return snakeCase(tableName)
    .toUpperCase()
    .split("_")
    .map(singularize)
    .join("_");
};

export const singularPascalCase = (tableName: string): string => {
  // Singularize each part, then PascalCase each part, handling uppercase input
  return tableName
    .split(/_|-|\s+/)
    .map((part) => part.toLowerCase())
    .map(singularize)
    .map((part) => upperFirst(camelCase(part)))
    .join("");
};

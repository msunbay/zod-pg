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
    .split("_")
    .map(singularize)
    .map((part) => part.toUpperCase())
    .join("_");
};

export const singularPascalCase = (tableName: string): string => {
  return tableName
    .split(/_|-|\s+/)
    .map(singularize)
    .map((part) => part.toLowerCase())
    .map((part) => upperFirst(camelCase(part)))
    .join("");
};

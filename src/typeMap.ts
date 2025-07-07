import type { ColumnInfo } from "./types";

import { pascalCase, singularPascalCase } from "./utils";

const TYPE_MAP: Record<
  string,
  string | ((col: ColumnInfo, tableName: string) => string)
> = {
  integer: "z.number().int()",
  int4: "z.number().int()",
  serial: "z.number().int()",
  serial4: "z.number().int()",
  bigserial: "z.number().int()",
  bigint: "z.number().int()",
  varchar: `z.string()`,
  "character varying": `z.string()`,
  character: `z.string()`,
  text: "z.string()",
  timestamptz: "z.date({ coerce: true })",
  timestamp: "z.date({ coerce: true })",
  "timestamp with time zone": "z.date({ coerce: true })",
  "timestamp without time zone": "z.date({ coerce: true })",
  date: "z.date({ coerce: true })",
  bool: "z.boolean()",
  boolean: "z.boolean()",
  jsonb: (col, table) =>
    `json.${singularPascalCase(table)}${pascalCase(col.name)}Schema`,
  json: "z.any()",
  _text: "z.array(z.string())",
  uuid: "z.string().uuid()",
  "ARRAY:_text": "z.array(z.string())",
};

export function mapColumnType(col: ColumnInfo, tableName: string): string {
  const { dataType, udtName } = col;

  const mapped = TYPE_MAP[dataType] || TYPE_MAP[`${dataType}:${udtName}`];
  if (typeof mapped === "function") return mapped(col, tableName);
  return mapped || "z.any()";
}

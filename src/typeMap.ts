import type { ColumnInfo } from './types';

const TYPE_MAP: Record<string, string> = {
  integer: 'z.number().int()',
  int4: 'z.number().int()',
  serial: 'z.number().int()',
  serial4: 'z.number().int()',
  bigserial: 'z.number().int()',
  bigint: 'z.number().int()',
  varchar: `z.string()`,
  'character varying': `z.string()`,
  character: `z.string()`,
  text: 'z.string()',
  timestamptz: 'z.date({ coerce: true })',
  timestamp: 'z.date({ coerce: true })',
  'timestamp with time zone': 'z.date({ coerce: true })',
  'timestamp without time zone': 'z.date({ coerce: true })',
  date: 'z.date({ coerce: true })',
  bool: 'z.boolean()',
  boolean: 'z.boolean()',
  jsonb: 'z.any()',
  json: 'z.any()',
  _text: 'z.array(z.string())',
  uuid: 'z.string().uuid()',
  'ARRAY:_text': 'z.array(z.string())',
};

export function mapColumnType(col: ColumnInfo, tableName: string): string {
  const { dataType, udtName } = col;

  return (
    TYPE_MAP[dataType] ||
    TYPE_MAP[`${dataType}:${udtName}`] ||
    TYPE_MAP[udtName] ||
    'z.any()'
  );
}

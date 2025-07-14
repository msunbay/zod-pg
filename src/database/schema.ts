import { Client } from 'pg';

import type {
  ColumnInfo,
  RawColumnInfo,
  SchemaInfo,
  TableInfo,
} from './types.js';

import { logDebug, sql } from '../utils/index.js';
import { getEnumConstraints } from './enumConstraints.js';

export const getSchemaInformation = async (
  client: Client,
  {
    schemaName,
    includeRegex,
    excludeRegex,
  }: { schemaName: string; includeRegex?: RegExp; excludeRegex?: RegExp }
): Promise<SchemaInfo> => {
  logDebug(`Retrieving schema information for schema '${schemaName}'`);

  const res = await client.query<RawColumnInfo>(
    sql`
      SELECT
        c.table_name AS "tableName",
        c.column_name AS "name",
        c.column_default AS "defaultValue",
        c.data_type AS "dataType",
        (c.is_nullable = 'YES') AS "isNullable",
        c.character_maximum_length AS "maxLen",
        c.udt_name AS "udtName",
        checks."checkConstraints"
      FROM information_schema.columns c
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('checkClause', pg_get_constraintdef(pgc.oid))) AS "checkConstraints"
        FROM pg_constraint pgc
        JOIN pg_class cls ON cls.oid = pgc.conrelid
        JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
        JOIN pg_attribute att ON att.attrelid = cls.oid AND att.attname = c.column_name
        WHERE pgc.contype = 'c'
          AND nsp.nspname = c.table_schema
          AND cls.relname = c.table_name
          AND pgc.conkey @> ARRAY[att.attnum]
      ) AS checks ON TRUE
      WHERE c.table_schema = $1
      ORDER BY c.table_name, c.ordinal_position;
    `,
    [schemaName]
  );

  const columns = res.rows;

  logDebug(`Retrieved ${columns.length} columns from schema '${schemaName}'`);

  let tables = columns.reduce<TableInfo[]>((acc, column) => {
    const existingTable = acc.find(
      (t) => t.name === column.tableName && t.schemaName === schemaName
    );

    const parsedColumn: ColumnInfo = {
      ...column,
      isEnum: false,
      isSerial: false,
    };

    if (column.checkConstraints) {
      parsedColumn.allowedValues = getEnumConstraints(
        column.name,
        column.checkConstraints.map((c) => c.checkClause)
      );

      logDebug(
        `Extracted enum values for column '${column.tableName}.${column.name}': ${JSON.stringify(parsedColumn.allowedValues)}`
      );
    }

    parsedColumn.isSerial = !!column.defaultValue?.match(/^nextval\(/i);
    parsedColumn.isEnum = !!parsedColumn.allowedValues?.length;

    if (existingTable) {
      existingTable.columns.push(parsedColumn);
    } else {
      acc.push({
        name: column.tableName,
        schemaName,
        columns: [parsedColumn],
      });
    }

    return acc;
  }, []);

  logDebug(`Found ${tables.length} tables in schema '${schemaName}'`);

  if (includeRegex) {
    const count = tables.length;

    tables = tables.filter((table) => includeRegex.test(table.name));

    logDebug(
      `Filtered tables by "include": ${count} -> ${tables.length} tables`
    );
  }

  if (excludeRegex) {
    const count = tables.length;

    tables = tables.filter((table) => !excludeRegex.test(table.name));

    logDebug(
      `Filtered tables by "exclude": ${count} -> ${tables.length} tables`
    );
  }

  return {
    name: schemaName,
    tables,
  };
};

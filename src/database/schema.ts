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
        SELECT json_agg(json_build_object('checkClause', cc.check_clause)) AS "checkConstraints"
        FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc
          ON cc.constraint_name = tc.constraint_name
         AND cc.constraint_schema = tc.constraint_schema
        JOIN information_schema.constraint_column_usage kcu
          ON cc.constraint_name = kcu.constraint_name
         AND cc.constraint_schema = kcu.constraint_schema
        WHERE tc.constraint_type = 'CHECK'
          AND kcu.table_name = c.table_name
          AND kcu.column_name = c.column_name
          AND kcu.table_schema = c.table_schema
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

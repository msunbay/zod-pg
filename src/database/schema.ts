import { Client } from 'pg';

import { logDebug, sql } from '../utils';
import { parsePgArray } from './array';
import { getEnumConstraints } from './enumConstraints';
import { ColumnInfo, SchemaInfo, TableInfo } from './types';

export const getSchemaInformation = async (
  client: Client,
  {
    schemaName,
    includeRegex,
    excludeRegex,
  }: { schemaName: string; includeRegex?: RegExp; excludeRegex?: RegExp }
): Promise<SchemaInfo> => {
  logDebug(`Retrieving schema information for schema '${schemaName}'`);

  const res = await client.query<ColumnInfo>(
    sql`
        SELECT
        c.table_name AS "tableName",
        c.column_name AS "name",
        c.data_type AS "dataType",
        c.is_nullable AS "isNullable",
        c.character_maximum_length AS "maxLen",
        c.udt_name AS "udtName",
        (
            SELECT array_agg(cc.check_clause)
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
        ) AS "checkConstraints"
        FROM information_schema.columns c
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

    if (column.checkConstraints) {
      logDebug(
        `Parsing constraints for column '${column.tableName}.${column.name}': ${column.checkConstraints}`
      );

      const parsedConstraints = parsePgArray(column.checkConstraints);
      column.allowedValues = getEnumConstraints(column.name, parsedConstraints);

      logDebug(
        `Extracted enum values for column '${column.tableName}.${column.name}': ${JSON.stringify(column.allowedValues)}`
      );
    }

    if (existingTable) {
      existingTable.columns.push(column);
    } else {
      acc.push({
        name: column.tableName,
        schemaName,
        columns: [column],
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

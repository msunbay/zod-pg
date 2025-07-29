import { Client } from 'pg';

import type {
  ZodPgColumnInfo,
  ZodPgRawColumnInfo,
  ZodPgSchemaInfo,
  ZodPgTableInfo,
} from '../types.js';

import { logDebug, sql } from '../utils/index.js';
import { getEnumConstraints } from './enumConstraints.js';
import { getZodType, isArrayType, isSerialType } from './typeMap.js';

export const getSchemaInformation = async (
  client: Client,
  {
    schemaName = 'public',
    include,
    exclude,
  }: {
    schemaName?: string;
    include?: string | string[];
    exclude?: string | string[];
  }
): Promise<ZodPgSchemaInfo> => {
  logDebug(`Retrieving schema information for schema '${schemaName}'`);

  const res = await client.query<ZodPgRawColumnInfo>(
    sql`
      SELECT
        c.relname AS "tableName",
        a.attname AS "name",
        pg_get_expr(d.adbin, d.adrelid) AS "defaultValue",
        t.typname AS "dataType",
        NOT a.attnotnull AS "isNullable",
        CASE 
          WHEN a.atttypmod > 0 THEN a.atttypmod - 4
          ELSE NULL
        END AS "maxLen",
        t.typname AS "udtName",
        checks."checkConstraints",
        obj_description(c.oid, 'pg_class') AS "description",
        CASE 
          WHEN c.relkind = 'r' THEN 'table'
          WHEN c.relkind = 'v' THEN 'view'
          WHEN c.relkind = 'm' THEN 'materialized_view'
          WHEN c.relkind = 'f' THEN 'foreign_table'
          ELSE 'unknown'
        END AS "tableType"
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      JOIN pg_type t ON t.oid = a.atttypid
      LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('checkClause', pg_get_constraintdef(pgc.oid))) AS "checkConstraints"
        FROM pg_constraint pgc
        WHERE pgc.conrelid = c.oid
          AND pgc.contype = 'c'
          AND pgc.conkey @> ARRAY[a.attnum]
      ) AS checks ON TRUE
      WHERE n.nspname = $1
        AND c.relkind IN ('r', 'v', 'm', 'f')
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum;
    `,
    [schemaName]
  );

  const columns = res.rows;

  logDebug(`Retrieved ${columns.length} columns from schema '${schemaName}'`);

  let tables = columns.reduce<ZodPgTableInfo[]>((acc, column) => {
    const existingTable = acc.find(
      (t) => t.name === column.tableName && t.schemaName === schemaName
    );

    const parsedColumn: ZodPgColumnInfo = {
      ...column,
      maxLen: column.maxLen ?? undefined,
      isEnum: false,
      isSerial: false,
      isArray: false,
      zodType: 'any', // Default type, will be updated later
    };

    if (column.checkConstraints) {
      parsedColumn.enumValues = getEnumConstraints(
        column.name,
        column.checkConstraints.map((c) => c.checkClause)
      );

      logDebug(
        `Extracted enum values for column '${column.tableName}.${column.name}': ${JSON.stringify(parsedColumn.enumValues)}`
      );
    }

    parsedColumn.zodType = getZodType(column);
    parsedColumn.isArray = isArrayType(column);
    parsedColumn.isSerial = isSerialType(column);
    parsedColumn.isEnum = !!parsedColumn.enumValues?.length;

    if (existingTable) {
      existingTable.columns.push(parsedColumn);
    } else {
      acc.push({
        type: column.tableType,
        name: column.tableName,
        schemaName,
        columns: [parsedColumn],
      });
    }

    return acc;
  }, []);

  // sort tables by type and name
  tables.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return a.name.localeCompare(b.name);
  });

  logDebug(`Found ${tables.length} tables in schema '${schemaName}'`);

  if (include) {
    const count = tables.length;
    if (typeof include === 'string') {
      const includeRegex = new RegExp(include);

      tables = tables.filter((table) => includeRegex.test(table.name));
    } else {
      tables = tables.filter((table) =>
        include.some((name) => name === table.name)
      );
    }

    logDebug(
      `Filtered tables by "include": ${count} -> ${tables.length} tables`
    );
  }

  if (exclude) {
    const count = tables.length;

    if (typeof exclude === 'string') {
      const excludeRegex = new RegExp(exclude);

      tables = tables.filter((table) => !excludeRegex.test(table.name));
    } else {
      tables = tables.filter((table) =>
        exclude.every((name) => name !== table.name)
      );
    }

    logDebug(
      `Filtered tables by "exclude": ${count} -> ${tables.length} tables`
    );
  }

  return {
    name: schemaName,
    tables: tables,
  };
};

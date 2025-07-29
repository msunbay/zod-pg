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
        c.table_name AS "tableName",
        c.column_name AS "name",
        c.column_default AS "defaultValue",
        c.data_type AS "dataType",
        (c.is_nullable = 'YES') AS "isNullable",
        c.character_maximum_length AS "maxLen",
        c.udt_name AS "udtName",
        checks."checkConstraints",
        pgd.description AS "description"
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
      LEFT JOIN pg_class cls ON cls.relname = c.table_name AND cls.relnamespace = (
        SELECT oid FROM pg_namespace WHERE nspname = c.table_schema
      )
      LEFT JOIN pg_description pgd ON pgd.objoid = cls.oid AND pgd.objsubid = c.ordinal_position
      WHERE c.table_schema = $1
      ORDER BY c.table_name, c.ordinal_position;
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
        name: column.tableName,
        schemaName,
        columns: [parsedColumn],
      });
    }

    return acc;
  }, []);

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

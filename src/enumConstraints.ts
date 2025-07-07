import type { Client } from 'pg';
import type { CheckConstraint } from './types';

import { sql } from './utils';

/**
 * Returns a mapping of column_name -> allowed values for enum-like constraints.
 * Supports: col = ANY (ARRAY['a','b']), col IN ('a','b'), col = 'a' OR col = 'b', col <@ ARRAY['a','b']
 */
export async function getEnumConstraints(
  client: Client,
  tableName: string
): Promise<Record<string, string[]>> {
  const enumConstraints: Record<string, string[]> = {};
  const res = await client.query<CheckConstraint>(
    sql`
    SELECT
      kcu.column_name as "columnName",
      cc.check_clause as "checkClause"
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    JOIN information_schema.constraint_column_usage kcu ON cc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = $1 AND tc.constraint_type = 'CHECK'
  `,
    [tableName]
  );

  for (const row of res.rows) {
    const { columnName, checkClause } = row;
    // Match col = ANY (ARRAY['a','b'])
    let match = checkClause.match(
      /\(\s*"?([a-zA-Z0-9_]+)"?\s*=\s*ANY\s*\(ARRAY\[(.*?)\]\)\s*\)/
    );

    if (match && match[1] === columnName) {
      const values = match[2].split(',').map((v) =>
        v
          .trim()
          .replace(/'::text/g, '')
          .replace(/'/g, '')
      );

      enumConstraints[columnName] = values;
      continue;
    }

    // Match col IN ('a','b')
    match = checkClause.match(/\(\s*"?([a-zA-Z0-9_]+)"?\s+IN\s+\((.*?)\)\s*\)/);

    if (match && match[1] === columnName) {
      const values = match[2].split(',').map((v) =>
        v
          .trim()
          .replace(/'::text/g, '')
          .replace(/'/g, '')
      );

      enumConstraints[columnName] = values;
      continue;
    }

    // Match col = 'a' OR col = 'b' OR ...
    match = checkClause.match(
      /\(\s*((?:"?[a-zA-Z0-9_]+"?\s*=\s*'[^']+'\s*OR\s*)+"?[a-zA-Z0-9_]+"?\s*=\s*'[^']+')\s*\)/
    );

    if (match) {
      const orParts = match[1].split(/\s+OR\s+/);
      const values: string[] = [];

      for (const part of orParts) {
        const eqMatch = part.match(/"?([a-zA-Z0-9_]+)"?\s*=\s*'([^']+)'/);

        if (eqMatch && eqMatch[1] === columnName) {
          values.push(eqMatch[2]);
        }
      }

      if (values.length > 0) {
        enumConstraints[columnName] = values;
      }

      continue;
    }

    // Match array contains: (roles <@ ARRAY['admin'::text, 'employee'::text])
    match = checkClause.match(
      /\(\s*([a-zA-Z0-9_]+)\s*<@\s*ARRAY\[(.*?)\]\s*\)/
    );

    if (match && match[1] === columnName) {
      const values = match[2].split(',').map((v) =>
        v
          .trim()
          .replace(/'::text/g, '')
          .replace(/'/g, '')
      );

      enumConstraints[columnName] = values;
      continue;
    }
  }

  return enumConstraints;
}

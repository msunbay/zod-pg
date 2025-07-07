import { writeFileSync } from 'fs';
import { Client } from 'pg';

import { EXCLUDED_TABLES, OUTPUT_PATH } from './constants';
import { generateTableSchema } from './generateTableSchema';
import { clearOutputDirectory, sql } from './utils';

/**
 * Main entrypoint: connects to Postgres, cleans output, generates Zod schemas for all tables, and writes an index file.
 */
const main = async () => {
  clearOutputDirectory();

  const client = new Client({
    password: process.env.POSTGRES_PASSWORD,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
  });

  await client.connect();

  try {
    // Get all user tables in the public schema
    const tablesRes = await client.query(sql`
      SELECT table_name 
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE' 
      ORDER BY table_name;`);

    const tableNames = tablesRes.rows.map(
      (row: { table_name: string }) => row.table_name
    );

    for (const tableName of tableNames) {
      if (EXCLUDED_TABLES.includes(tableName)) {
        console.debug(`Skipping excluded table: ${tableName}`);
        continue;
      }

      console.log(`Generating schema for table: ${tableName}`);
      await generateTableSchema(client, tableName);
    }

    // generate index file
    const indexContent = tableNames
      .filter((name) => !EXCLUDED_TABLES.includes(name))
      .map((name) => `export * from './${name}';`)
      .join('\n');

    const indexFilePath = `${OUTPUT_PATH}/index.ts`;
    writeFileSync(indexFilePath, indexContent);
    console.log(`Generated index file at ${indexFilePath}`);
  } finally {
    await client.end();
  }
};

if (require.main === module) {
  void main();
}

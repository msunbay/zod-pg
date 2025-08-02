import fs from 'fs';
import path from 'path';

import type { ZodPgColumn, ZodPgTable } from '../../../../src/types.js';

import { generateZodSchemas } from '../../../../src/generateZodSchemas.js';
import {
  deleteOutputFiles,
  getClientConnectionString,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;

const outputDir = `${import.meta.dirname}/test-output/hooks`;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('hook options', () => {
  it('applies onColumnModelCreated hook to modify column schemas', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/column-hook`,
      include: ['users'],
      onColumnModelCreated: (column: ZodPgColumn) => {
        // Add custom validation to email columns
        if (column.name === 'email') {
          return {
            ...column,
            renderedReadType: column.renderedReadType + '.email()',
            renderedWriteType: column.renderedWriteType + '.email()',
          };
        }
        return column;
      },
    });

    const outputFiles = await getOutputFiles(`${outputDir}/column-hook`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check if email validation was applied
      if (content.includes('email')) {
        expect(content).toMatch(/\.email\(\)/);
      }

      expect(content).toMatchSnapshot(
        `column-hook/${path.relative(`${outputDir}/column-hook`, file)}`
      );
    }
  });

  it('applies onTableModelCreated hook to modify table schemas', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/table-hook`,
      include: ['users'],
      onTableModelCreated: (table: ZodPgTable) => {
        // Add a custom description to all tables
        return {
          ...table,
          description: `Generated schema for ${table.tableName} table`,
        };
      },
    });

    const outputFiles = await getOutputFiles(`${outputDir}/table-hook`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(
        `table-hook/${path.relative(`${outputDir}/table-hook`, file)}`
      );
    }
  });

  it('applies both column and table hooks together', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/combined-hooks`,
      include: ['users'],
      onColumnModelCreated: (column: ZodPgColumn) => {
        // Mark all string columns as trimmed
        if (column.type === 'string') {
          return {
            ...column,
            renderedWriteType: column.renderedWriteType + '.trim()',
          };
        }
        return column;
      },
      onTableModelCreated: (table: ZodPgTable) => {
        // Add table metadata
        return {
          ...table,
          description: `Table: ${table.tableName} (${table.readableColumns.length} columns)`,
        };
      },
    });

    const outputFiles = await getOutputFiles(`${outputDir}/combined-hooks`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(
        `combined-hooks/${path.relative(`${outputDir}/combined-hooks`, file)}`
      );
    }
  });
});

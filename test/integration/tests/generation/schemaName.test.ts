import fs from 'fs';
import path from 'path';

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

const outputDir = `${import.meta.dirname}/test-output/schema-name`;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('schema name option', () => {
  it('generates schemas for default schema (public)', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/default-schema`,
      include: ['users'],
      // schemaName not specified, should default to 'public'
    });

    const outputFiles = await getOutputFiles(`${outputDir}/default-schema`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `default-schema/${path.relative(`${outputDir}/default-schema`, file)}`
      );
    }
  });

  it('generates schemas for explicitly specified public schema', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/explicit-public`,
      schemaName: 'public',
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(`${outputDir}/explicit-public`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `explicit-public/${path.relative(`${outputDir}/explicit-public`, file)}`
      );
    }
  });

  // Note: Testing custom schemas would require creating them in the test database
  // For now, we'll just test the public schema variations
});

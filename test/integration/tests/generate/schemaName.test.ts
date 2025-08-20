import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../../src/generateZodSchemas.js';
import {
  getClientConnectionString,
  getOutputDir,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

describe('schema name option', () => {
  it('generates schemas for default schema (public)', async () => {
    const outputDir = getOutputDir('generate', 'schemaName', 'default-schema');

    await generateZodSchemas({
      connectionString,
      moduleResolution: 'esm',
      outputDir,
      include: ['users'],
      // schemaName not specified, should default to 'public'
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas for explicitly specified public schema', async () => {
    const outputDir = getOutputDir('generate', 'schemaName', 'explicit-public');

    await generateZodSchemas({
      connectionString,
      moduleResolution: 'esm',
      outputDir,
      schemaName: 'public',
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  // Note: Testing custom schemas would require creating them in the test database
  // For now, we'll just test the public schema variations
});

import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../../src/generateZodSchemas.js';
import {
  getClientConnectionString,
  getOutputFiles,
  outputDir,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;

describe('generateZodSchemas', () => {
  beforeAll(async () => {
    ctx = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb(ctx);
  });

  it('generates correct zod schemas', async () => {
    const connectionString = getClientConnectionString();

    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },

      schemaName: 'public',
      outputDir,
      outputModule: 'esm',
      zodVersion: 4,
    });

    const outputFiles = getOutputFiles();

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});

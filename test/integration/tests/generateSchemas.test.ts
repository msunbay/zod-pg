import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  getClientConnectionString,
  getOutputFiles,
  outputDir,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../testDbUtils.js';

const schemaPath = path.resolve(__dirname, '../schema.sql');
let ctx: TestDbContext;

beforeAll(async () => {
  ctx = await setupTestDb(schemaPath);
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
    jsonSchemaImportLocation: '../../json.js',
    outputModule: 'esm',
  });

  const outputFiles = getOutputFiles();

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});

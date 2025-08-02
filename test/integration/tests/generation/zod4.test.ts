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

const outputDir = `${import.meta.dirname}/test-output/zod4`;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

it('generates schemas compatible with zod version 4', async () => {
  await generateZodSchemas({
    connection: {
      connectionString,
      ssl: false,
    },
    outputDir,
    moduleResolution: 'esm',
    zodVersion: 4,
    include: ['users'],
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});

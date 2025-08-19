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

it('generates schemas compatible with zod version 4 mini', async () => {
  const outputDir = getOutputDir('generate', 'zod4Mini');

  await generateZodSchemas({
    connection: {
      connectionString,
      ssl: false,
    },
    outputDir,
    moduleResolution: 'esm',
    zodVersion: '4-mini',
    include: ['users'],
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import {
  deleteOutputFiles,
  getClientConnectionString,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;
const cliPath = path.resolve(import.meta.dirname, '../../../../index.js');
const outputDir = `${import.meta.dirname}/test-output/zod-version`;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('CLI Zod Version', () => {
  it('CLI works with --zod-version option', async () => {
    const connectionString = getClientConnectionString();

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${outputDir}" --zod-version 4 --silent --include users --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(outputDir);
    const usersFile = outputFiles.find((file) =>
      file.includes('users/schema.ts')
    );

    expect(usersFile).toBeDefined();
    const content = fs.readFileSync(usersFile!, 'utf8');
    // Zod v4 uses z.int() instead of z.number().int()
    expect(content).toMatch(/z\.int\(\)/);
  });
});

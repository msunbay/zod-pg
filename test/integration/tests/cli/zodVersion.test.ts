import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import {
  getClientConnectionString,
  getOutputDir,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;

const cliPath = path.resolve(import.meta.dirname, '../../../../index.js');

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

describe('CLI Zod Version', () => {
  it('CLI works with --zod-version option', async () => {
    const connectionString = getClientConnectionString();
    const outputDir = getOutputDir('cli', 'zodVersion', 'zod-version-4');

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

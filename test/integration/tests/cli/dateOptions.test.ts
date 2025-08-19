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

describe('CLI Date Options', () => {
  it('CLI works with --disable-coerce-dates option', async () => {
    const outputDir = getOutputDir('cli', 'dateOptions');
    const connectionString = getClientConnectionString();

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${outputDir}" --disable-coerce-dates --silent --include users --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(outputDir);
    const usersFile = outputFiles.find((file) =>
      file.includes('users/schema.ts')
    );

    expect(usersFile).toBeDefined();
    const content = fs.readFileSync(usersFile!, 'utf8');
    expect(content).not.toMatch(/z\.coerce\.date\(\)/);
  });
});

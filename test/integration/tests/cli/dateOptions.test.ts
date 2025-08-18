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
const outputDir = `${import.meta.dirname}/test-output/date-options`;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('CLI Date Options', () => {
  it('CLI works with --coerce-dates option', async () => {
    const connectionString = getClientConnectionString();

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${outputDir}" --coerce-dates --silent --include users --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(outputDir);
    const usersFile = outputFiles.find((file) =>
      file.includes('users/schema.ts')
    );

    expect(usersFile).toBeDefined();
    const content = fs.readFileSync(usersFile!, 'utf8');
    expect(content).toMatch(/z\.coerce\.date\(\)/);
  });
});

import { execSync } from 'child_process';
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
const outputDir = `${import.meta.dirname}/test-output/include-exclude`;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('CLI Include/Exclude Options', () => {
  it('CLI works with --exclude option', async () => {
    const connectionString = getClientConnectionString();
    const testOutputDir = `${outputDir}/exclude`;

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${testOutputDir}" --exclude "posts" --silent --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(testOutputDir);
    const hasPostsFile = outputFiles.some((file) =>
      file.includes('posts/schema.ts')
    );

    expect(hasPostsFile).toBe(false);
  });

  it('CLI works with --include option', async () => {
    const connectionString = getClientConnectionString();
    const testOutputDir = `${outputDir}/include`;

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${testOutputDir}" --include "users" --silent --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(testOutputDir);
    const hasUsersFile = outputFiles.some((file) =>
      file.includes('users/schema.ts')
    );
    const hasPostsFile = outputFiles.some((file) =>
      file.includes('posts/schema.ts')
    );

    expect(hasUsersFile).toBe(true);
    expect(hasPostsFile).toBe(false);
  });
});

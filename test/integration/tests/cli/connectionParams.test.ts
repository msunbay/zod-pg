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
const outputDir = `${import.meta.dirname}/test-output/connection-params`;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('CLI Connection Parameters', () => {
  it('CLI works with connection parameters instead of connection string', async () => {
    // Use the same connection details as the test database
    const connectionString = getClientConnectionString();
    const url = new URL(connectionString);

    execSync(
      `node ${cliPath} --host ${url.hostname} --port ${url.port} --database ${url.pathname.slice(1)} --user ${url.username} --password ${url.password} --output "${outputDir}" --silent --include users --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(outputDir);
    expect(outputFiles.length).toBeGreaterThan(0);
  });
});

import { execSync } from 'child_process';
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

it('CLI works with connection parameters instead of connection string', async () => {
  const outputDir = getOutputDir('cli', 'connectionParams');

  // Use the same connection details as the test database
  const connectionString = getClientConnectionString();
  const url = new URL(connectionString);

  execSync(
    `node ${cliPath} --host ${url.hostname} --port ${url.port} --database ${url.pathname.slice(1)} --user ${url.username} --password ${url.password} --output-dir "${outputDir}" --silent --include users --module-resolution esm`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);
  expect(outputFiles.length).toBeGreaterThan(0);
});

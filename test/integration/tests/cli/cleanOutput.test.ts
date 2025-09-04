import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import {
  deleteOutputFiles,
  getClientConnectionString,
  getOutputDir,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;

const cliPath = path.resolve(import.meta.dirname, '../../../../index.js');
const outputDir = getOutputDir('cli', 'cleanOutput');

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

it('CLI works with --clean-output option', async () => {
  // Create the directory with a dummy .ts file (clearTablesDirectory only removes .ts files)
  fs.mkdirSync(outputDir, { recursive: true });
  const dummyFile = path.join(outputDir, 'dummy.ts');
  fs.writeFileSync(dummyFile, 'export const dummy = "test";');

  // Verify dummy file exists before running command
  expect(fs.existsSync(dummyFile)).toBe(true);

  const connectionString = getClientConnectionString();

  execSync(
    `node ${cliPath} --connection-string "${connectionString}" --output-dir "${outputDir}" --clean-output --silent --include users --module-resolution esm`,
    { stdio: 'inherit' }
  );

  // Check that dummy file was removed (clearTablesDirectory removes .ts files)
  const dummyExists = fs.existsSync(dummyFile);
  expect(dummyExists).toBe(false);

  // Check that new files were generated
  const outputFiles = await getOutputFiles(outputDir);
  expect(outputFiles.length).toBeGreaterThan(0);
});

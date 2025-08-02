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
const outputDir = `${import.meta.dirname}/test-output/json-options`;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('CLI JSON Options', () => {
  it('CLI works with --stringify-json option', async () => {
    const connectionString = getClientConnectionString();

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${outputDir}" --stringify-json --silent --include "^posts$" --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(outputDir);
    const postsFile = outputFiles.find(
      (file) => file.includes('posts.ts') && !file.includes('mv_user_posts')
    );

    expect(postsFile).toBeDefined();
    const content = fs.readFileSync(postsFile!, 'utf8');
    // Should contain JSON.stringify transforms in write schemas (check for presence of write schema with metadata field)
    expect(content).toMatch(
      /metadata.*JSON\.stringify|JSON\.stringify.*metadata/s
    );
  });
});

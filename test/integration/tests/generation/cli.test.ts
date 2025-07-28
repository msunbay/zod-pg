import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import {
  getClientConnectionString,
  getOutputFiles,
  outputDir,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

const cliPath = path.resolve(__dirname, '../../../../index.js');
let ctx: TestDbContext;

describe('CLI Tests', () => {
  beforeAll(async () => {
    ctx = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb(ctx);
  });

  it('CLI generates correct zod schemas', () => {
    const connectionString = getClientConnectionString();

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${outputDir}" --json-schema-import-location "../../json.js" --silent --module esm --schema public`,
      { stdio: 'inherit' }
    );

    const outputFiles = getOutputFiles();

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});

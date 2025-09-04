import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import {
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

it('CLI generates correct zod schemas with env vars', async () => {
  const outputDir = getOutputDir('cli', 'envVars');

  process.env.ZOD_PG_USER = ctx.client.user;
  process.env.ZOD_PG_PASSWORD = ctx.client.password;
  process.env.ZOD_PG_HOST = ctx.client.host;
  process.env.ZOD_PG_PORT = ctx.client.port.toString();
  process.env.ZOD_PG_DATABASE = ctx.client.database;

  execSync(
    `node ${cliPath} --output-dir "${outputDir}" --silent --module-resolution esm --schema-name public`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});

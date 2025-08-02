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

const cliPath = path.resolve(__dirname, '../../../../index.js');
const outputDir = `${import.meta.dirname}/test-output/cli`;
let ctx: TestDbContext;

describe('CLI Tests', () => {
  beforeAll(async () => {
    ctx = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb(ctx);
    await deleteOutputFiles(outputDir);
  });

  it('CLI generates correct zod schemas with basic options', async () => {
    const connectionString = getClientConnectionString();

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${outputDir}" --json-schema-import-location "../../json.js" --silent --module esm --schema public`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles();

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('CLI works with --coerce-dates option', async () => {
    const connectionString = getClientConnectionString();
    const testOutputDir = `${outputDir}/coerce-dates`;

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${testOutputDir}" --coerce-dates --silent --include users --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(testOutputDir);
    const usersFile = outputFiles.find((file) => file.includes('users.ts'));

    expect(usersFile).toBeDefined();
    const content = fs.readFileSync(usersFile!, 'utf8');
    expect(content).toMatch(/z\.coerce\.date\(\)/);
  });

  it('CLI works with --stringify-json option', async () => {
    const connectionString = getClientConnectionString();
    const testOutputDir = `${outputDir}/stringify-json`;

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${testOutputDir}" --stringify-json --silent --include "^posts$" --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(testOutputDir);
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

  it('CLI works with --exclude option', async () => {
    const connectionString = getClientConnectionString();
    const testOutputDir = `${outputDir}/exclude`;

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${testOutputDir}" --exclude "posts" --silent --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(testOutputDir);
    const hasPostsFile = outputFiles.some((file) => file.includes('posts.ts'));

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
    const hasUsersFile = outputFiles.some((file) => file.includes('users.ts'));
    const hasPostsFile = outputFiles.some((file) => file.includes('posts.ts'));

    expect(hasUsersFile).toBe(true);
    expect(hasPostsFile).toBe(false);
  });

  it('CLI works with connection parameters instead of connection string', async () => {
    const testOutputDir = `${outputDir}/connection-params`;

    // Use the same connection details as the test database
    const connectionString = getClientConnectionString();
    const url = new URL(connectionString);

    execSync(
      `node ${cliPath} --host ${url.hostname} --port ${url.port} --database ${url.pathname.slice(1)} --user ${url.username} --password ${url.password} --output "${testOutputDir}" --silent --include users --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(testOutputDir);
    expect(outputFiles.length).toBeGreaterThan(0);
  });

  it('CLI works with --clean option', async () => {
    const testOutputDir = `${outputDir}/clean`;

    // Create the directory with a dummy .ts file (clearTablesDirectory only removes .ts files)
    fs.mkdirSync(testOutputDir, { recursive: true });
    const dummyFile = path.join(testOutputDir, 'dummy.ts');
    fs.writeFileSync(dummyFile, 'export const dummy = "test";');

    // Verify dummy file exists before running command
    expect(fs.existsSync(dummyFile)).toBe(true);

    const connectionString = getClientConnectionString();

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${testOutputDir}" --clean --silent --include users --module esm`,
      { stdio: 'inherit' }
    );

    // Check that dummy file was removed (clearTablesDirectory removes .ts files)
    const dummyExists = fs.existsSync(dummyFile);
    expect(dummyExists).toBe(false);

    // Check that new files were generated
    const outputFiles = await getOutputFiles(testOutputDir);
    expect(outputFiles.length).toBeGreaterThan(0);
  });

  it('CLI works with --zod-version option', async () => {
    const connectionString = getClientConnectionString();
    const testOutputDir = `${outputDir}/zod4`;

    execSync(
      `node ${cliPath} --connection-string "${connectionString}" --output "${testOutputDir}" --zod-version 4 --silent --include users --module esm`,
      { stdio: 'inherit' }
    );

    const outputFiles = await getOutputFiles(testOutputDir);
    const usersFile = outputFiles.find((file) => file.includes('users.ts'));

    expect(usersFile).toBeDefined();
    const content = fs.readFileSync(usersFile!, 'utf8');
    // Zod v4 uses z.int() instead of z.number().int()
    expect(content).toMatch(/z\.int\(\)/);
  });
});

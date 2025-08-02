import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../../src/generateZodSchemas.js';
import {
  deleteOutputFiles,
  getClientConnectionString,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;

const outputDir = `${import.meta.dirname}/test-output/clean-output`;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('clean output option', () => {
  it('cleans output directory when cleanOutput is true', async () => {
    const testOutputDir = `${outputDir}/clean-enabled`;

    // Create the output directory with some existing files
    await fs.promises.mkdir(`${testOutputDir}/tables`, { recursive: true });
    await fs.promises.writeFile(
      `${testOutputDir}/tables/old-file.ts`,
      'old content'
    );
    await fs.promises.writeFile(
      `${testOutputDir}/old-root-file.ts`,
      'old root content'
    );

    // Verify files exist before generation
    expect(fs.existsSync(`${testOutputDir}/tables/old-file.ts`)).toBe(true);
    expect(fs.existsSync(`${testOutputDir}/old-root-file.ts`)).toBe(true);

    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: testOutputDir,
      cleanOutput: true,
      include: ['users'],
    });

    // Old files in tables directory should be cleaned
    expect(fs.existsSync(`${testOutputDir}/tables/old-file.ts`)).toBe(false);

    // cleanOutput should clean the entire output directory
    expect(fs.existsSync(`${testOutputDir}/tables/old-table-file.ts`)).toBe(
      false
    );
    expect(fs.existsSync(`${testOutputDir}/old-root-file.ts`)).toBe(false);

    const outputFiles = await getOutputFiles(testOutputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `clean-enabled/${path.relative(testOutputDir, file)}`
      );
    }
  });

  it('preserves existing files when cleanOutput is false', async () => {
    const testOutputDir = `${outputDir}/clean-disabled`;

    // Create the output directory with some existing files
    await fs.promises.mkdir(`${testOutputDir}/tables`, { recursive: true });
    await fs.promises.writeFile(
      `${testOutputDir}/tables/old-file.ts`,
      'old content'
    );

    // Verify file exists before generation
    expect(fs.existsSync(`${testOutputDir}/tables/old-file.ts`)).toBe(true);

    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: testOutputDir,
      cleanOutput: false,
      include: ['users'],
    });

    // Old file should still exist
    expect(fs.existsSync(`${testOutputDir}/tables/old-file.ts`)).toBe(true);
    const oldContent = fs.readFileSync(
      `${testOutputDir}/tables/old-file.ts`,
      'utf8'
    );
    expect(oldContent).toBe('old content');

    const outputFiles = await getOutputFiles(testOutputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `clean-disabled/${path.relative(testOutputDir, file)}`
      );
    }
  });
});

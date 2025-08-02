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

const outputDir = `${import.meta.dirname}/test-output/include-exclude`;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('include and exclude options', () => {
  it('generates schemas for specific tables using include string', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/include-string`,
      include: 'users',
    });

    const outputFiles = await getOutputFiles(`${outputDir}/include-string`);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should only have users table file (plus index.ts)
    expect(tableFiles.filter((f) => !f.includes('index.ts'))).toHaveLength(1);
    expect(tableFiles.some((file) => file.includes('users'))).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `include-string/${path.relative(`${outputDir}/include-string`, file)}`
      );
    }
  });

  it('generates schemas for specific tables using include array', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/include-array`,
      include: ['users', 'posts'],
    });

    const outputFiles = await getOutputFiles(`${outputDir}/include-array`);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should have users and posts table files (plus index.ts)
    expect(tableFiles.filter((f) => !f.includes('index.ts'))).toHaveLength(2);
    expect(tableFiles.some((file) => file.includes('users'))).toBe(true);
    expect(tableFiles.some((file) => file.includes('posts'))).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `include-array/${path.relative(`${outputDir}/include-array`, file)}`
      );
    }
  });

  it('generates schemas excluding specific tables using exclude string', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/exclude-string`,
      exclude: 'posts',
    });

    const outputFiles = await getOutputFiles(`${outputDir}/exclude-string`);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should not have posts table file
    expect(tableFiles.every((file) => !file.includes('posts'))).toBe(true);
    expect(tableFiles.some((file) => file.includes('users'))).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `exclude-string/${path.relative(`${outputDir}/exclude-string`, file)}`
      );
    }
  });

  it('generates schemas excluding multiple tables using exclude array', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/exclude-array`,
      exclude: ['posts', 'users'],
    });

    const outputFiles = await getOutputFiles(`${outputDir}/exclude-array`);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should not have posts or users table files
    expect(
      tableFiles.every(
        (file) => !file.includes('posts') && !file.includes('users')
      )
    ).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `exclude-array/${path.relative(`${outputDir}/exclude-array`, file)}`
      );
    }
  });

  it('respects both include and exclude options (exclude takes precedence)', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/include-exclude-combined`,
      include: ['users', 'posts'],
      exclude: ['posts'],
    });

    const outputFiles = await getOutputFiles(
      `${outputDir}/include-exclude-combined`
    );
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should only have users (posts is excluded even though included)
    expect(tableFiles.filter((f) => !f.includes('index.ts'))).toHaveLength(1);
    expect(tableFiles.some((file) => file.includes('users'))).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `include-exclude-combined/${path.relative(`${outputDir}/include-exclude-combined`, file)}`
      );
    }
  });
});

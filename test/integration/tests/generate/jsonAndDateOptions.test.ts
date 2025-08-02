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

const outputDir = `${import.meta.dirname}/test-output/json-and-date-options`;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('JSON and date handling options', () => {
  it('generates schemas with stringifyJson enabled', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/stringify-json`,
      stringifyJson: true,
      include: ['posts'], // posts table has JSON metadata column
    });

    const outputFiles = await getOutputFiles(`${outputDir}/stringify-json`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(
        `stringify-json/${path.relative(`${outputDir}/stringify-json`, file)}`
      );
    }
  });

  it('generates schemas with stringifyJson disabled', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/no-stringify-json`,
      stringifyJson: false,
      include: ['posts'],
    });

    const outputFiles = await getOutputFiles(`${outputDir}/no-stringify-json`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Should not contain JSON.stringify transforms
      expect(content).not.toMatch(/JSON\.stringify/);

      expect(content).toMatchSnapshot(
        `no-stringify-json/${path.relative(`${outputDir}/no-stringify-json`, file)}`
      );
    }
  });

  it('generates schemas with stringifyDates enabled', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/stringify-dates`,
      stringifyDates: true,
      include: ['users'], // users table has date columns
    });

    const outputFiles = await getOutputFiles(`${outputDir}/stringify-dates`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(
        `stringify-dates/${path.relative(`${outputDir}/stringify-dates`, file)}`
      );
    }
  });

  it('generates schemas with defaultEmptyArray enabled', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/default-empty-array`,
      defaultEmptyArray: true,
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(
      `${outputDir}/default-empty-array`
    );

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(
        `default-empty-array/${path.relative(`${outputDir}/default-empty-array`, file)}`
      );
    }
  });

  it('generates schemas with coerceDates enabled', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/coerce-dates`,
      coerceDates: true,
      include: ['users'], // users table has date columns
    });

    const outputFiles = await getOutputFiles(`${outputDir}/coerce-dates`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Should use z.coerce.date() in read schemas for date columns
      if (file.includes('users.ts')) {
        expect(content).toMatch(/z\.coerce\.date\(\)/);
      }

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(
        `coerce-dates/${path.relative(`${outputDir}/coerce-dates`, file)}`
      );
    }
  });
});

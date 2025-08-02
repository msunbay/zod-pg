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

const outputDir = `${import.meta.dirname}/test-output/casing`;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('casing options', () => {
  it('generates schemas with camelCase field names and PascalCase object names (default)', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/default`,
      fieldNameCasing: 'camelCase',
      objectNameCasing: 'PascalCase',
      include: ['users', 'posts'],
    });

    const outputFiles = await getOutputFiles(`${outputDir}/default`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `default/${path.relative(`${outputDir}/default`, file)}`
      );
    }
  });

  it('generates schemas with snake_case field names', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/snake-case-fields`,
      fieldNameCasing: 'snake_case',
      objectNameCasing: 'PascalCase',
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(`${outputDir}/snake-case-fields`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(
        `snake-case-fields/${path.relative(`${outputDir}/snake-case-fields`, file)}`
      );
    }
  });

  it('generates schemas with kebab-case object names', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/kebab-case-objects`,
      fieldNameCasing: 'camelCase',
      objectNameCasing: 'kebab-case',
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(`${outputDir}/kebab-case-objects`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(
        `kebab-case-objects/${path.relative(`${outputDir}/kebab-case-objects`, file)}`
      );
    }
  });

  it('generates schemas with passthrough casing', async () => {
    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/passthrough`,
      fieldNameCasing: 'passthrough',
      objectNameCasing: 'passthrough',
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(`${outputDir}/passthrough`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `passthrough/${path.relative(`${outputDir}/passthrough`, file)}`
      );
    }
  });
});

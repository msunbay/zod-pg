import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../../src/generateZodSchemas.js';
import {
  getClientConnectionString,
  getOutputDir,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

describe('casing options', () => {
  it('generates schemas with camelCase field names and PascalCase object names (default)', async () => {
    const outputDir = getOutputDir('generate', 'casing', 'default');

    await generateZodSchemas({
      connectionString,
      moduleResolution: 'esm',
      outputDir,
      fieldNameCasing: 'camelCase',
      objectNameCasing: 'PascalCase',
      include: ['users', 'posts'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas with snake_case field names', async () => {
    const outputDir = getOutputDir('generate', 'casing', 'snake-case-fields');

    await generateZodSchemas({
      connectionString,
      moduleResolution: 'esm',
      outputDir: outputDir,
      fieldNameCasing: 'snake_case',
      objectNameCasing: 'PascalCase',
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Test captures the actual generated code
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas with passthrough casing', async () => {
    const outputDir = getOutputDir('generate', 'casing', 'passthrough');

    await generateZodSchemas({
      connectionString,
      moduleResolution: 'esm',
      outputDir,
      fieldNameCasing: 'passthrough',
      objectNameCasing: 'passthrough',
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});

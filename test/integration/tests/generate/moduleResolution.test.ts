import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../../src/generateZodSchemas.js';
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
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(getOutputDir('generate', 'moduleResolution'));
});

describe('module resolution formats', () => {
  it('generates modules without file extensions (commonjs module resolution)', async () => {
    const outputDir = getOutputDir('generate', 'moduleResolution', 'commonjs');

    await generateZodSchemas({
      connectionString,
      outputDir,
      moduleResolution: 'commonjs',
      include: ['users'],
    });
    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check that imports/exports don't include file extensions
      const importExportLines = content
        .split('\n')
        .filter((line) => line.includes('import') || line.includes('export'));

      for (const line of importExportLines) {
        if (line.includes("from './") || line.includes("from '../")) {
          expect(line).not.toMatch(/\.js['"]|\.ts['"]/);
        }
      }

      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates modules with file extensions (esm module resolution)', async () => {
    const outputDir = getOutputDir('generate', 'moduleResolution', 'esm');

    await generateZodSchemas({
      connectionString,
      outputDir,
      moduleResolution: 'esm',
      include: ['users'],
    });
    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');

      // Check that relative imports include file extensions
      const importExportLines = content
        .split('\n')
        .filter((line) => line.includes('import') || line.includes('export'));

      for (const line of importExportLines) {
        if (line.includes("from './") || line.includes("from '../")) {
          expect(line).toMatch(/\.js['"]/);
        }
      }

      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});

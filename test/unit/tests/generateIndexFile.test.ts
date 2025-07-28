import { mkdirSync, readFileSync, rmSync } from 'fs';
import { dirname } from 'path';
import { vi } from 'vitest';

import { ZodPgTableInfo } from '../../../src/database/types.js';
import { generateTablesIndexFile } from '../../../src/generate/generateIndexFile.js';

describe('generateTablesIndexFile', () => {
  const outputDir = './test/tmp';
  const tables = [{ name: 'users' }, { name: 'accounts' }] as ZodPgTableInfo[];
  const filePath = `${outputDir}/tables/index.ts`;

  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Ensure output and tables directories exist
    mkdirSync(dirname(filePath), { recursive: true });
  });

  afterEach(() => {
    // Remove the generated file and its parent directories
    try {
      rmSync(outputDir, { recursive: true });
    } catch {}
  });

  it('should generate an index file exporting all tables', async () => {
    await generateTablesIndexFile({ tables, name: 'public' }, { outputDir });

    const content = readFileSync(filePath, 'utf8');
    expect(content).toContain("export * from './users';");
    expect(content).toContain("export * from './accounts';");
  });
});

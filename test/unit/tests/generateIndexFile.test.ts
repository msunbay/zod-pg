import { mkdirSync, readFileSync, rmSync } from 'fs';
import { dirname } from 'path';

import { TableInfo } from '../../../src/database/types';
import { generateTablesIndexFile } from '../../../src/generate/generateIndexFile';

describe('generateTablesIndexFile', () => {
  const outputPath = './test/tmp';
  const tables = [{ name: 'users' }, { name: 'accounts' }] as TableInfo[];
  const filePath = `${outputPath}/tables/index.ts`;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Ensure output and tables directories exist
    mkdirSync(dirname(filePath), { recursive: true });
  });

  afterEach(() => {
    // Remove the generated file and its parent directories
    try {
      rmSync(outputPath, { recursive: true });
    } catch {}
  });

  it('should generate an index file exporting all tables', async () => {
    await generateTablesIndexFile(outputPath, {
      tables,
      name: 'public',
    });

    const content = readFileSync(filePath, 'utf8');
    expect(content).toContain("export * from './users';");
    expect(content).toContain("export * from './accounts';");
  });
});

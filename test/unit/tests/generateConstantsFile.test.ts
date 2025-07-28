import { mkdirSync, readFileSync, rmSync } from 'fs';
import { vi } from 'vitest';

import { ZodPgSchemaInfo } from '../../../src/database/types.js';
import { generateConstantsFile } from '../../../src/generate/generateConstantsFile.js';

describe('generateConstantsFile', () => {
  const outputDir = './test/tmp';
  const filePath = `${outputDir}/constants.ts`;
  const schema = {
    tables: [{ name: 'users' }, { name: 'accounts' }],
  } as ZodPgSchemaInfo;

  beforeAll(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    mkdirSync(outputDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(outputDir, { recursive: true });
    } catch {}
  });

  it('should generate a constants file', async () => {
    await generateConstantsFile(schema, { outputDir });
    const content = readFileSync(filePath, 'utf8');

    expect(content).toContain("export const TABLE_USERS = 'users';");
    expect(content).toContain("export const TABLE_ACCOUNTS = 'accounts';");
  });
});

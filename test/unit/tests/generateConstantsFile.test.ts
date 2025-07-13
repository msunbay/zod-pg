import { mkdirSync, readFileSync, rmSync } from 'fs';

import { SchemaInfo } from '../../../src/database/types';
import { generateConstantsFile } from '../../../src/generate/generateConstantsFile';

describe('generateConstantsFile', () => {
  const outputPath = './test/tmp';
  const filePath = `${outputPath}/constants.ts`;
  const schema = {
    tables: [{ name: 'users' }, { name: 'accounts' }],
  } as SchemaInfo;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    mkdirSync(outputPath, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(outputPath, { recursive: true });
    } catch {}
  });

  it('should generate a constants file', async () => {
    await generateConstantsFile(outputPath, schema);
    const content = readFileSync(filePath, 'utf8');

    expect(content).toContain("export const TABLE_USERS = 'users';");
    expect(content).toContain("export const TABLE_ACCOUNTS = 'accounts';");
  });
});

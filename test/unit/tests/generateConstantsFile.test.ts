import { promises as fs } from 'fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ZodPgSchemaInfo } from '../../../src/types.js';

import { generateConstantsFile } from '../../../src/generate/generateConstantsFile.js';

// Mock dependencies
vi.mock('fs');
vi.mock('../../../src/utils/debug.js');
vi.mock('../../../src/generate/template.js');

const mockWriteFile = vi.mocked(fs.writeFile);
const mockRenderTemplate = vi.fn();

// Mock the template module
vi.doMock('../../../src/generate/template.js', () => ({
  renderTemplate: mockRenderTemplate,
}));

describe('generateConstantsFile', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRenderTemplate.mockResolvedValue('// Generated constants');
  });

  it('should generate constants file for schema tables', async () => {
    const schema: ZodPgSchemaInfo = {
      name: 'public',
      tables: [
        { name: 'users', schemaName: 'public', type: 'table' } as any,
        { name: 'posts', schemaName: 'public', type: 'table' } as any,
      ],
    };

    const config = { outputDir: '/output' };

    await generateConstantsFile(schema, config);

    expect(mockRenderTemplate).toHaveBeenCalledWith('constants', {
      constants: [
        { name: 'USERS', value: 'users' },
        { name: 'POSTS', value: 'posts' },
      ],
    });
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/output/constants.ts',
      '// Generated constants',
      'utf8'
    );
  });

  it('should handle schema with prefix', async () => {
    const schema: ZodPgSchemaInfo = {
      name: 'auth',
      tables: [{ name: 'users', schemaName: 'auth', type: 'table' } as any],
    };

    const config = { outputDir: '/output' };

    await generateConstantsFile(schema, config);

    expect(mockRenderTemplate).toHaveBeenCalledWith('constants', {
      constants: [{ name: 'AUTH_USERS', value: 'users' }],
    });
  });

  it('should handle empty schema', async () => {
    const schema: ZodPgSchemaInfo = {
      name: 'public',
      tables: [],
    };

    const config = { outputDir: '/output' };

    await generateConstantsFile(schema, config);

    expect(mockRenderTemplate).toHaveBeenCalledWith('constants', {
      constants: [],
    });
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/output/constants.ts',
      '// Generated constants',
      'utf8'
    );
  });
});

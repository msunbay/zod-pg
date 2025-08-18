import { cosmiconfig } from 'cosmiconfig';

import { getConfiguration } from '../../../src/config.js';

// Mock cosmiconfig
vi.mock('cosmiconfig');

describe('getConfiguration', () => {
  const mockExplorer = {
    search: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(cosmiconfig).mockReturnValue(mockExplorer as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return default config when no configuration file is found', async () => {
    mockExplorer.search.mockResolvedValue(null);

    const config = await getConfiguration();

    expect(config).toEqual({
      connection: {
        database: 'postgres',
        host: 'localhost',
        port: '5432',
        user: 'postgres',
        password: 'postgres',
      },
      outputDir: './zod-schemas',
    });
    expect(cosmiconfig).toHaveBeenCalledWith('zod-pg');
  });

  it('should return merged config when configuration file is found', async () => {
    const mockConfig = {
      connection: {
        host: 'localhost',
        port: 5432,
        user: 'testuser',
      },
      outputDir: './custom-output',
      schemaName: 'test_schema',
    };

    mockExplorer.search.mockResolvedValue({
      config: mockConfig,
      filepath: '/path/to/config',
    });

    const config = await getConfiguration();

    expect(config).toEqual({
      connection: {
        host: 'localhost',
        port: 5432,
        user: 'testuser',
      },
      outputDir: './custom-output',
      schemaName: 'test_schema',
    });
  });

  it('should handle partial connection config', async () => {
    const mockConfig = {
      outputDir: './schemas',
      connection: {
        host: 'db.example.com',
      },
    };

    mockExplorer.search.mockResolvedValue({
      config: mockConfig,
      filepath: '/path/to/config',
    });

    const config = await getConfiguration();

    expect(config).toEqual({
      connection: {
        host: 'db.example.com',
      },
      outputDir: './schemas',
    });
  });

  it('should handle empty config object', async () => {
    mockExplorer.search.mockResolvedValue({
      config: {},
      filepath: '/path/to/config',
    });

    const config = await getConfiguration();

    expect(config).toEqual({
      connection: {},
    });
  });
});

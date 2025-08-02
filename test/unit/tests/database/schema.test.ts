import { Client } from 'pg';

import { getEnumConstraints } from '../../../../src/database/enumConstraints.js';
import { getSchemaInformation } from '../../../../src/database/schema.js';
import {
  getZodType,
  isArrayType,
  isSerialType,
} from '../../../../src/database/typeMap.js';
import { ZodPgRawColumnInfo, ZodPgTableType } from '../../../../src/types.js';
// Import mocked functions for type safety
import { logDebug } from '../../../../src/utils/index.js';

// Mock the dependencies
vi.mock('../../../../src/utils/index.js', () => ({
  logDebug: vi.fn(),
  sql: (strings: TemplateStringsArray, ...values: any[]) => {
    // Simple mock that returns the SQL string with placeholders
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
      result += `$${i + 1}${strings[i + 1]}`;
    }
    return result;
  },
}));

vi.mock('../../../../src/database/enumConstraints.js', () => ({
  getEnumConstraints: vi.fn(),
}));

vi.mock('../../../../src/database/typeMap.js', () => ({
  getZodType: vi.fn(),
  isArrayType: vi.fn(),
  isSerialType: vi.fn(),
}));

// Helper function to create mock column data
const createMockColumn = (
  overrides: Partial<ZodPgRawColumnInfo> = {}
): ZodPgRawColumnInfo => ({
  name: 'test_column',
  defaultValue: undefined,
  isNullable: true,
  maxLen: undefined,
  dataType: 'text',
  tableName: 'test_table',
  schemaName: 'public',
  description: undefined,
  checkConstraints: undefined,
  tableType: 'table' as ZodPgTableType,
  ...overrides,
});

// Helper function to create mock client
const createMockClient = (mockRows: ZodPgRawColumnInfo[] = []) => {
  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: mockRows }),
  } as unknown as Client;
  return mockClient;
};

describe('schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(getZodType).mockReturnValue('string');
    vi.mocked(isArrayType).mockReturnValue(false);
    vi.mocked(isSerialType).mockReturnValue(false);
    vi.mocked(getEnumConstraints).mockReturnValue([]);
  });

  describe('getSchemaInformation', () => {
    it('should retrieve schema information with default parameters', async () => {
      const mockColumns = [
        createMockColumn({
          tableName: 'users',
          name: 'id',
          dataType: 'int4',
        }),
        createMockColumn({
          tableName: 'users',
          name: 'name',
          dataType: 'text',
        }),
      ];

      const client = createMockClient(mockColumns);

      const result = await getSchemaInformation(client, {});

      expect(result).toEqual({
        name: 'public',
        tables: [
          {
            type: 'table',
            name: 'users',
            schemaName: 'public',
            columns: [
              expect.objectContaining({
                name: 'id',
                udtName: 'int4',
                zodType: 'string',
                isEnum: false,
                isSerial: false,
                isArray: false,
              }),
              expect.objectContaining({
                name: 'name',
                udtName: 'text',
                zodType: 'string',
                isEnum: false,
                isSerial: false,
                isArray: false,
              }),
            ],
          },
        ],
      });

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['public']
      );
    });

    it('should use custom schema name', async () => {
      const client = createMockClient([]);

      await getSchemaInformation(client, { schemaName: 'custom_schema' });

      expect(client.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['custom_schema']
      );
    });

    it('should handle multiple tables with different types', async () => {
      const mockColumns = [
        createMockColumn({
          tableName: 'users',
          name: 'id',
          tableType: 'table',
        }),
        createMockColumn({
          tableName: 'user_view',
          name: 'id',
          tableType: 'view',
        }),
        createMockColumn({
          tableName: 'user_materialized',
          name: 'id',
          tableType: 'materialized_view',
        }),
      ];

      const client = createMockClient(mockColumns);

      const result = await getSchemaInformation(client, {});

      expect(result.tables).toHaveLength(3);
      expect(result.tables[0].type).toBe('materialized_view');
      expect(result.tables[1].type).toBe('table');
      expect(result.tables[2].type).toBe('view');
      expect(result.tables[0].name).toBe('user_materialized');
      expect(result.tables[1].name).toBe('users');
      expect(result.tables[2].name).toBe('user_view');
    });

    it('should group columns by table', async () => {
      const mockColumns = [
        createMockColumn({
          tableName: 'users',
          name: 'id',
        }),
        createMockColumn({
          tableName: 'users',
          name: 'name',
        }),
        createMockColumn({
          tableName: 'posts',
          name: 'id',
        }),
      ];

      const client = createMockClient(mockColumns);

      const result = await getSchemaInformation(client, {});

      expect(result.tables).toHaveLength(2);
      expect(result.tables[0].name).toBe('posts');
      expect(result.tables[0].columns).toHaveLength(1);
      expect(result.tables[1].name).toBe('users');
      expect(result.tables[1].columns).toHaveLength(2);
    });

    it('should process enum constraints', async () => {
      const mockCheckConstraints = [
        { checkClause: "status IN ('active', 'inactive')" },
      ];

      const mockColumns = [
        createMockColumn({
          tableName: 'users',
          name: 'status',
          checkConstraints: mockCheckConstraints,
        }),
      ];

      vi.mocked(getEnumConstraints).mockReturnValue(['active', 'inactive']);

      const client = createMockClient(mockColumns);

      const result = await getSchemaInformation(client, {});

      expect(getEnumConstraints).toHaveBeenCalledWith('status', [
        "status IN ('active', 'inactive')",
      ]);
      expect(result.tables[0].columns[0].enumValues).toEqual([
        'active',
        'inactive',
      ]);
      expect(result.tables[0].columns[0].isEnum).toBe(true);
    });

    it('should handle columns without enum constraints', async () => {
      const mockColumns = [
        createMockColumn({
          tableName: 'users',
          name: 'name',
          checkConstraints: undefined,
        }),
      ];

      const client = createMockClient(mockColumns);

      const result = await getSchemaInformation(client, {});

      expect(getEnumConstraints).not.toHaveBeenCalled();
      expect(result.tables[0].columns[0].enumValues).toBeUndefined();
      expect(result.tables[0].columns[0].isEnum).toBe(false);
    });

    it('should set column properties based on typeMap functions', async () => {
      const mockColumns = [
        createMockColumn({
          tableName: 'users',
          name: 'id',
          dataType: 'serial',
        }),
      ];

      vi.mocked(getZodType).mockReturnValue('int');
      vi.mocked(isArrayType).mockReturnValue(false);
      vi.mocked(isSerialType).mockReturnValue(true);

      const client = createMockClient(mockColumns);

      const result = await getSchemaInformation(client, {});

      expect(getZodType).toHaveBeenCalledWith(mockColumns[0]);
      expect(isArrayType).toHaveBeenCalledWith(mockColumns[0]);
      expect(isSerialType).toHaveBeenCalledWith(mockColumns[0]);

      expect(result.tables[0].columns[0].type).toBe('int');
      expect(result.tables[0].columns[0].isArray).toBe(false);
      expect(result.tables[0].columns[0].isSerial).toBe(true);
    });

    it('should handle array types', async () => {
      const mockColumns = [
        createMockColumn({
          tableName: 'users',
          name: 'tags',
          dataType: '_text',
        }),
      ];

      vi.mocked(isArrayType).mockReturnValue(true);

      const client = createMockClient(mockColumns);

      const result = await getSchemaInformation(client, {});

      expect(result.tables[0].columns[0].isArray).toBe(true);
    });

    describe('include filtering', () => {
      const mockColumns = [
        createMockColumn({ tableName: 'users' }),
        createMockColumn({ tableName: 'posts' }),
        createMockColumn({ tableName: 'comments' }),
      ];

      it('should filter tables by include string (regex)', async () => {
        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {
          include: '^user',
        });

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('users');
      });

      it('should filter tables by include array', async () => {
        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {
          include: ['users', 'posts'],
        });

        expect(result.tables).toHaveLength(2);
        expect(result.tables.map((t: any) => t.name).sort()).toEqual([
          'posts',
          'users',
        ]);
      });

      it('should handle include with no matches', async () => {
        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {
          include: 'nonexistent',
        });

        expect(result.tables).toHaveLength(0);
      });
    });

    describe('exclude filtering', () => {
      const mockColumns = [
        createMockColumn({ tableName: 'users' }),
        createMockColumn({ tableName: 'posts' }),
        createMockColumn({ tableName: 'comments' }),
      ];

      it('should filter tables by exclude string (regex)', async () => {
        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {
          exclude: '^user',
        });

        expect(result.tables).toHaveLength(2);
        expect(result.tables.map((t: any) => t.name).sort()).toEqual([
          'comments',
          'posts',
        ]);
      });

      it('should filter tables by exclude array', async () => {
        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {
          exclude: ['users', 'posts'],
        });

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('comments');
      });

      it('should handle exclude with no matches', async () => {
        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {
          exclude: 'nonexistent',
        });

        expect(result.tables).toHaveLength(3);
      });
    });

    describe('combined include and exclude filtering', () => {
      const mockColumns = [
        createMockColumn({ tableName: 'user_profiles' }),
        createMockColumn({ tableName: 'user_settings' }),
        createMockColumn({ tableName: 'posts' }),
        createMockColumn({ tableName: 'comments' }),
      ];

      it('should apply include first, then exclude', async () => {
        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {
          include: '^user_',
          exclude: 'settings',
        });

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('user_profiles');
      });
    });

    describe('edge cases', () => {
      it('should handle empty result set', async () => {
        const client = createMockClient([]);

        const result = await getSchemaInformation(client, {});

        expect(result).toEqual({
          name: 'public',
          tables: [],
        });
      });

      it('should handle maxLen conversion', async () => {
        const mockColumns = [
          createMockColumn({
            tableName: 'users',
            name: 'name',
            maxLen: 100,
          }),
        ];

        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {});

        expect(result.tables[0].columns[0].maxLen).toBe(100);
      });

      it('should handle null maxLen', async () => {
        const mockColumns = [
          createMockColumn({
            tableName: 'users',
            name: 'name',
            maxLen: undefined,
          }),
        ];

        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {});

        expect(result.tables[0].columns[0].maxLen).toBeUndefined();
      });

      it('should preserve schemaName in column info', async () => {
        const mockColumns = [
          createMockColumn({
            tableName: 'users',
            name: 'id',
          }),
        ];

        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {
          schemaName: 'custom_schema',
        });

        expect(result.tables[0].columns[0].schemaName).toBe('custom_schema');
      });

      it('should call logDebug with appropriate messages', async () => {
        const mockColumns = [
          createMockColumn({
            tableName: 'users',
            name: 'status',
            checkConstraints: [{ checkClause: "status IN ('active')" }],
          }),
        ];

        vi.mocked(getEnumConstraints).mockReturnValue(['active']);

        const client = createMockClient(mockColumns);

        await getSchemaInformation(client, { schemaName: 'test_schema' });

        expect(logDebug).toHaveBeenCalledWith(
          "Retrieving schema information for schema 'test_schema'"
        );
        expect(logDebug).toHaveBeenCalledWith(
          "Retrieved 1 columns from schema 'test_schema'"
        );
        expect(logDebug).toHaveBeenCalledWith(
          "Found 1 tables in schema 'test_schema'"
        );
        expect(logDebug).toHaveBeenCalledWith(
          'Extracted enum values for column \'users.status\': ["active"]'
        );
      });
    });

    describe('table sorting', () => {
      it('should sort tables by type then by name', async () => {
        const mockColumns = [
          createMockColumn({
            tableName: 'z_table',
            tableType: 'table',
          }),
          createMockColumn({
            tableName: 'a_view',
            tableType: 'view',
          }),
          createMockColumn({
            tableName: 'a_table',
            tableType: 'table',
          }),
          createMockColumn({
            tableName: 'z_view',
            tableType: 'view',
          }),
        ];

        const client = createMockClient(mockColumns);

        const result = await getSchemaInformation(client, {});

        expect(result.tables.map((t: any) => `${t.type}-${t.name}`)).toEqual([
          'table-a_table',
          'table-z_table',
          'view-a_view',
          'view-z_view',
        ]);
      });
    });
  });
});

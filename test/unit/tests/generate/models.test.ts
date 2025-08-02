import {
  formatEnumConstantName,
  formatEnumTypeName,
  formatJsonSchemaName,
  formatTableRecordName,
  formatTableSchemaName,
} from '../../../../src/generate/format.js';
import { createTableModel } from '../../../../src/generate/models.js';
import {
  createRenderReadTransform,
  createRenderWriteTransform,
  renderReadField,
  renderWriteField,
} from '../../../../src/generate/render.js';
import {
  ZodPgColumnInfo,
  ZodPgConfig,
  ZodPgTableInfo,
  ZodPgTableType,
} from '../../../../src/types.js';
// Import mocked functions for type safety
import {
  convertCaseFormat,
  formatSingularString,
} from '../../../../src/utils/casing.js';

// Mock the dependencies
vi.mock('../../../../src/utils/casing.js', () => ({
  convertCaseFormat: vi.fn(),
  formatSingularString: vi.fn(),
}));

vi.mock('../../../../src/generate/format.js', () => ({
  formatEnumConstantName: vi.fn(),
  formatEnumTypeName: vi.fn(),
  formatJsonSchemaName: vi.fn(),
  formatTableRecordName: vi.fn(),
  formatTableSchemaName: vi.fn(),
}));

vi.mock('../../../../src/generate/render.js', () => ({
  createRenderReadTransform: vi.fn(),
  createRenderWriteTransform: vi.fn(),
  renderReadField: vi.fn(),
  renderWriteField: vi.fn(),
}));

// Helper function to create mock column info
const createMockColumn = (
  overrides: Partial<ZodPgColumnInfo> = {}
): ZodPgColumnInfo => ({
  name: 'test_column',
  dataType: 'text',
  defaultValue: undefined,
  isNullable: true,
  maxLen: undefined,
  tableName: 'test_table',
  schemaName: 'public',
  description: undefined,
  checkConstraints: undefined,
  tableType: 'table' as ZodPgTableType,
  type: 'string',
  isEnum: false,
  isSerial: false,
  isArray: false,
  enumValues: undefined,
  ...overrides,
});

// Helper function to create mock table info
const createMockTableInfo = (
  overrides: Partial<ZodPgTableInfo> = {}
): ZodPgTableInfo => ({
  type: 'table' as ZodPgTableType,
  name: 'test_table',
  schemaName: 'public',
  columns: [createMockColumn()],
  ...overrides,
});

// Helper function to create mock config
const createMockConfig = (
  overrides: Partial<ZodPgConfig> = {}
): ZodPgConfig => ({
  connection: {
    connectionString: 'postgresql://localhost:5432/test',
  },
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
  outputDir: './generated',
  zodVersion: 4,
  schemaName: 'public',
  jsonSchemaImportLocation: undefined,
  ...overrides,
});

describe('models', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    vi.mocked(convertCaseFormat).mockReturnValue('testColumn');
    vi.mocked(formatSingularString).mockReturnValue('TestTable');
    vi.mocked(formatEnumConstantName).mockReturnValue(
      'TEST_TABLE_TEST_COLUMN_ENUM'
    );
    vi.mocked(formatEnumTypeName).mockReturnValue('TestTableTestColumnEnum');
    vi.mocked(formatJsonSchemaName).mockReturnValue(
      'TestTableTestColumnJsonSchema'
    );
    vi.mocked(formatTableRecordName).mockReturnValue('TestTableRecord');
    vi.mocked(formatTableSchemaName).mockReturnValue('TestTableSchema');
    vi.mocked(renderReadField).mockReturnValue('z.string()');
    vi.mocked(renderWriteField).mockReturnValue('z.string()');
    vi.mocked(createRenderReadTransform).mockReturnValue(
      () => () => '.transform(...)'
    );
    vi.mocked(createRenderWriteTransform).mockReturnValue(
      () => () => '.transform(...)'
    );
  });

  describe('createTableModel', () => {
    it('should create a basic table model with default configuration', async () => {
      const tableInfo = createMockTableInfo({
        name: 'users',
        columns: [
          createMockColumn({
            name: 'id',
            type: 'int',
            isSerial: true,
          }),
          createMockColumn({
            name: 'name',
            type: 'string',
          }),
        ],
      });
      const config = createMockConfig();

      const result = await createTableModel(tableInfo, config);

      expect(result).toEqual({
        type: 'table',
        tableName: 'users',
        schemaName: 'public',
        tableSingularName: 'TestTable',
        tableReadSchemaName: 'TestTableSchema',
        tableInsertSchemaName: 'TestTableSchema',
        tableUpdateSchemaName: 'TestTableSchema',
        tableInsertRecordName: 'TestTableRecord',
        tableReadRecordName: 'TestTableRecord',
        tableUpdateRecordName: 'TestTableRecord',
        jsonSchemaImportLocation: undefined,
        jsonSchemaImports: undefined,
        hasJsonSchemaImports: false,
        readableColumns: expect.arrayContaining([
          expect.objectContaining({
            name: 'id',
            propertyName: 'testColumn',
            isWritable: false, // Serial columns are not writable
          }),
          expect.objectContaining({
            name: 'name',
            propertyName: 'testColumn',
            isWritable: true, // Non-serial columns in tables are writable
          }),
        ]),
        writableColumns: expect.arrayContaining([
          expect.objectContaining({
            name: 'name',
            isWritable: true,
          }),
        ]),
        enums: [],
        isWritable: true,
      });

      expect(formatTableSchemaName).toHaveBeenCalledWith(
        tableInfo,
        'read',
        'PascalCase'
      );
      expect(formatTableSchemaName).toHaveBeenCalledWith(
        tableInfo,
        'insert',
        'PascalCase'
      );
      expect(formatTableSchemaName).toHaveBeenCalledWith(
        tableInfo,
        'update',
        'PascalCase'
      );
    });

    it('should handle view tables with no writable columns', async () => {
      const tableInfo = createMockTableInfo({
        type: 'view',
        name: 'user_view',
        columns: [
          createMockColumn({
            name: 'id',
            tableType: 'view',
          }),
          createMockColumn({
            name: 'name',
            tableType: 'view',
          }),
        ],
      });
      const config = createMockConfig();

      const result = await createTableModel(tableInfo, config);

      expect(result.isWritable).toBe(false);
      expect(result.writableColumns).toHaveLength(0);
      result.readableColumns.forEach((column) => {
        expect(column.isWritable).toBe(false);
      });
    });

    it('should handle enum columns correctly', async () => {
      const tableInfo = createMockTableInfo({
        columns: [
          createMockColumn({
            name: 'status',
            isEnum: true,
            enumValues: ['active', 'inactive', 'pending'],
          }),
        ],
      });
      const config = createMockConfig();

      const result = await createTableModel(tableInfo, config);

      expect(result.enums).toHaveLength(1);
      expect(result.enums[0]).toEqual({
        constantName: 'TEST_TABLE_TEST_COLUMN_ENUM',
        typeName: 'TestTableTestColumnEnum',
        values: [
          { value: 'active', last: false },
          { value: 'inactive', last: false },
          { value: 'pending', last: true },
        ],
      });

      expect(formatEnumConstantName).toHaveBeenCalledWith(
        'test_table',
        'status'
      );
      expect(formatEnumTypeName).toHaveBeenCalledWith(
        'test_table',
        'status',
        'PascalCase'
      );
    });

    it('should handle JSON schema imports when configured', async () => {
      const tableInfo = createMockTableInfo({
        columns: [
          createMockColumn({
            name: 'data',
            type: 'json',
          }),
          createMockColumn({
            name: 'metadata',
            type: 'json',
          }),
          createMockColumn({
            name: 'description',
            type: 'string',
          }),
        ],
      });
      const config = createMockConfig({
        jsonSchemaImportLocation: './schemas',
      });

      const result = await createTableModel(tableInfo, config);

      expect(result.jsonSchemaImportLocation).toBe('./schemas');
      expect(result.hasJsonSchemaImports).toBe(true);
      expect(result.jsonSchemaImports).toHaveLength(2);
      expect(result.jsonSchemaImports).toEqual([
        { name: 'TestTableTestColumnJsonSchema', last: false },
        { name: 'TestTableTestColumnJsonSchema', last: true },
      ]);
    });

    it('should not create JSON schema imports when not configured', async () => {
      const tableInfo = createMockTableInfo({
        columns: [
          createMockColumn({
            name: 'data',
            type: 'json',
          }),
        ],
      });
      const config = createMockConfig({
        jsonSchemaImportLocation: undefined,
      });

      const result = await createTableModel(tableInfo, config);

      expect(result.jsonSchemaImportLocation).toBeUndefined();
      expect(result.hasJsonSchemaImports).toBe(false);
      expect(result.jsonSchemaImports).toBeUndefined();
    });

    it('should call onColumnModelCreated hook when provided', async () => {
      const onColumnModelCreated = vi
        .fn()
        .mockImplementation(async (column) => ({
          ...column,
          customProperty: 'modified',
          renderedReadType: 'custom.read.type',
        }));

      const tableInfo = createMockTableInfo({
        columns: [createMockColumn({ name: 'test_col' })],
      });
      const config = createMockConfig({
        onColumnModelCreated,
      });

      const result = await createTableModel(tableInfo, config);

      expect(onColumnModelCreated).toHaveBeenCalledTimes(1);
      expect(onColumnModelCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test_col',
          propertyName: 'testColumn',
        })
      );

      expect(result.readableColumns[0]).toEqual(
        expect.objectContaining({
          customProperty: 'modified',
          renderedReadType: 'custom.read.type',
        })
      );
    });

    it('should re-render types when onColumnModelCreated does not modify them', async () => {
      const onColumnModelCreated = vi
        .fn()
        .mockImplementation(async (column) => ({
          ...column,
          customProperty: 'modified',
          // renderedReadType unchanged, should be re-rendered
        }));

      const tableInfo = createMockTableInfo({
        columns: [createMockColumn({ name: 'test_col' })],
      });
      const config = createMockConfig({
        onColumnModelCreated,
      });

      await createTableModel(tableInfo, config);

      // Should be called twice: once for initial model creation, once for re-rendering after hook
      expect(renderReadField).toHaveBeenCalledTimes(2);
      expect(renderWriteField).toHaveBeenCalledTimes(2);
    });

    it('should call onTableModelCreated hook when provided', async () => {
      const onTableModelCreated = vi.fn().mockImplementation(async (table) => ({
        ...table,
        customTableProperty: 'table-modified',
      }));

      const tableInfo = createMockTableInfo();
      const config = createMockConfig({
        onTableModelCreated,
      });

      const result = await createTableModel(tableInfo, config);

      expect(onTableModelCreated).toHaveBeenCalledTimes(1);
      expect(onTableModelCreated).toHaveBeenCalledWith(
        expect.objectContaining({
          tableName: 'test_table',
          type: 'table',
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          customTableProperty: 'table-modified',
        })
      );
    });

    it('should handle columns with custom enum type names', async () => {
      // Create a column and then add enumTypeName via the hook since it's part of the processed model
      const onColumnModelCreated = vi
        .fn()
        .mockImplementation(async (column) => ({
          ...column,
          enumTypeName: 'CustomStatusType',
        }));

      const tableInfo = createMockTableInfo({
        columns: [
          createMockColumn({
            name: 'status',
            isEnum: true,
            enumValues: ['active', 'inactive'],
          }),
        ],
      });
      const config = createMockConfig({
        onColumnModelCreated,
      });

      const result = await createTableModel(tableInfo, config);

      expect(result.enums[0].typeName).toBe('CustomStatusType');
      // Should not call formatEnumTypeName when custom type name is provided
      expect(formatEnumTypeName).not.toHaveBeenCalled();
    });

    it('should handle empty enum values', async () => {
      const tableInfo = createMockTableInfo({
        columns: [
          createMockColumn({
            name: 'status',
            isEnum: true,
            enumValues: [],
          }),
        ],
      });
      const config = createMockConfig();

      const result = await createTableModel(tableInfo, config);

      expect(result.enums).toHaveLength(1);
      expect(result.enums[0].values).toEqual([]);
    });

    it('should handle undefined enum values', async () => {
      const tableInfo = createMockTableInfo({
        columns: [
          createMockColumn({
            name: 'status',
            isEnum: true,
            enumValues: undefined,
          }),
        ],
      });
      const config = createMockConfig();

      const result = await createTableModel(tableInfo, config);

      expect(result.enums).toHaveLength(1);
      expect(result.enums[0].values).toEqual([]);
    });

    it('should correctly identify writable columns', async () => {
      const tableInfo = createMockTableInfo({
        columns: [
          createMockColumn({
            name: 'id',
            isSerial: true,
            tableType: 'table',
          }),
          createMockColumn({
            name: 'name',
            isSerial: false,
            tableType: 'table',
          }),
          createMockColumn({
            name: 'view_column',
            isSerial: false,
            tableType: 'view',
          }),
        ],
      });
      const config = createMockConfig();

      const result = await createTableModel(tableInfo, config);

      expect(result.readableColumns).toHaveLength(3);
      expect(result.writableColumns).toHaveLength(1);
      expect(result.writableColumns[0].name).toBe('name');
      expect(result.isWritable).toBe(true);
    });

    it('should handle materialized view table type', async () => {
      const tableInfo = createMockTableInfo({
        type: 'materialized_view',
        name: 'mv_users',
        columns: [
          createMockColumn({
            name: 'id',
            tableType: 'materialized_view',
          }),
        ],
      });
      const config = createMockConfig();

      const result = await createTableModel(tableInfo, config);

      expect(result.type).toBe('materialized_view');
      expect(result.tableName).toBe('mv_users');
      expect(result.isWritable).toBe(false);
    });

    it('should call formatting functions with correct parameters', async () => {
      const tableInfo = createMockTableInfo({
        name: 'test_table',
        columns: [
          createMockColumn({
            name: 'test_column',
            tableName: 'test_table',
          }),
        ],
      });
      const config = createMockConfig({
        fieldNameCasing: 'snake_case',
        objectNameCasing: 'kebab-case',
      });

      await createTableModel(tableInfo, config);

      expect(convertCaseFormat).toHaveBeenCalledWith(
        'test_column',
        'snake_case'
      );
      expect(formatSingularString).toHaveBeenCalledWith(
        'test_table',
        'kebab-case'
      );
      expect(formatEnumConstantName).toHaveBeenCalledWith(
        'test_table',
        'test_column'
      );
      expect(formatJsonSchemaName).toHaveBeenCalledWith(
        'test_table',
        'test_column',
        'kebab-case'
      );
      expect(formatTableRecordName).toHaveBeenCalledWith(
        tableInfo,
        'read',
        'kebab-case'
      );
      expect(formatTableRecordName).toHaveBeenCalledWith(
        tableInfo,
        'insert',
        'kebab-case'
      );
      expect(formatTableRecordName).toHaveBeenCalledWith(
        tableInfo,
        'update',
        'kebab-case'
      );
    });

    it('should handle columns with different zodTypes', async () => {
      const tableInfo = createMockTableInfo({
        columns: [
          createMockColumn({
            name: 'id',
            type: 'int',
          }),
          createMockColumn({
            name: 'name',
            type: 'string',
          }),
          createMockColumn({
            name: 'created_at',
            type: 'date',
          }),
          createMockColumn({
            name: 'is_active',
            type: 'boolean',
          }),
          createMockColumn({
            name: 'metadata',
            type: 'json',
          }),
        ],
      });
      const config = createMockConfig();

      const result = await createTableModel(tableInfo, config);

      expect(result.readableColumns).toHaveLength(5);
      result.readableColumns.forEach((column) => {
        expect(renderReadField).toHaveBeenCalledWith(
          expect.objectContaining({ name: column.name }),
          config
        );
        expect(renderWriteField).toHaveBeenCalledWith(
          expect.objectContaining({ name: column.name }),
          config
        );
      });
    });
  });
});

import type {
  ZodPgColumnBaseModel,
  ZodPgColumnInfo,
  ZodPgColumnType,
  ZodPgConfig,
  ZodPgZodVersion,
} from '../../../../src/types.js';

import {
  createRenderReadTransform,
  createRenderWriteTransform,
  renderReadField,
  renderWriteField,
} from '../../../../src/generate/render.js';

describe('render', () => {
  let mockConfig: ZodPgConfig;
  let mockRender: (text: string) => string;

  // Helper function to create a mock ZodPgColumnInfo
  const createMockColumnInfo = (
    overrides: Partial<ZodPgColumnInfo> = {}
  ): ZodPgColumnInfo => ({
    name: 'test_column',
    dataType: 'text',
    isNullable: false,
    udtName: 'text',
    tableName: 'test_table',
    schemaName: 'public',
    zodType: 'string' as ZodPgColumnType,
    isEnum: false,
    isSerial: false,
    isArray: false,
    tableType: 'table',
    ...overrides,
  });

  // Helper function to create a mock ZodPgColumnBaseModel
  const createMockColumnBaseModel = (
    overrides: Partial<ZodPgColumnBaseModel> = {}
  ): ZodPgColumnBaseModel => ({
    name: 'test_column',
    propertyName: 'testColumn',
    dataType: 'text',
    isNullable: false,
    udtName: 'text',
    tableName: 'test_table',
    schemaName: 'public',
    zodType: 'string' as ZodPgColumnType,
    isEnum: false,
    isSerial: false,
    isArray: false,
    isWritable: true,
    tableType: 'table',
    ...overrides,
  });

  beforeEach(() => {
    mockConfig = {
      connection: { host: 'localhost', port: '5432', database: 'test' },
      outputDir: './output',
      defaultEmptyArray: false,
      stringifyJson: false,
      stringifyDates: false,
      zodVersion: 3,
    } as ZodPgConfig;

    mockRender = vi.fn((text: string) => text);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createRenderReadTransform', () => {
    it('should return original text for non-nullable column', () => {
      const column = createMockColumnInfo({
        isNullable: false,
        isArray: false,
      });

      const transform = createRenderReadTransform(column, mockConfig);
      const result = transform()('test content', mockRender);

      expect(result).toBe('test content');
      expect(mockRender).toHaveBeenCalledWith('test content');
    });

    it('should append ?? undefined for nullable column', () => {
      const column = createMockColumnInfo({
        isNullable: true,
        isArray: false,
      });

      const transform = createRenderReadTransform(column, mockConfig);
      const result = transform()('test content', mockRender);

      expect(result).toBe('test content ?? undefined');
    });

    it('should append ?? [] for nullable array with defaultEmptyArray config', () => {
      const column = createMockColumnInfo({
        isNullable: true,
        isArray: true,
      });

      const configWithEmptyArray = { ...mockConfig, defaultEmptyArray: true };
      const transform = createRenderReadTransform(column, configWithEmptyArray);
      const result = transform()('test content', mockRender);

      expect(result).toBe('test content ?? []');
    });

    it('should append ?? undefined for nullable array without defaultEmptyArray config', () => {
      const column = createMockColumnInfo({
        isNullable: true,
        isArray: true,
      });

      const transform = createRenderReadTransform(column, mockConfig);
      const result = transform()('test content', mockRender);

      expect(result).toBe('test content ?? undefined');
    });
  });

  describe('createRenderWriteTransform', () => {
    it('should return original text for non-json, non-date column', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
      });

      const transform = createRenderWriteTransform(column, mockConfig);
      const result = transform()('test content', mockRender);

      expect(result).toBe('test content');
    });

    it('should stringify JSON for non-nullable json column when stringifyJson is true', () => {
      const column = createMockColumnBaseModel({
        zodType: 'json',
        isNullable: false,
        isArray: false,
      });

      const configWithStringifyJson = { ...mockConfig, stringifyJson: true };
      const transform = createRenderWriteTransform(
        column,
        configWithStringifyJson
      );
      const result = transform()('value', mockRender);

      expect(result).toBe('JSON.stringify(value)');
    });

    it('should conditionally stringify JSON for nullable json column when stringifyJson is true', () => {
      const column = createMockColumnBaseModel({
        zodType: 'json',
        isNullable: true,
        isArray: false,
      });

      const configWithStringifyJson = { ...mockConfig, stringifyJson: true };
      const transform = createRenderWriteTransform(
        column,
        configWithStringifyJson
      );
      const result = transform()('value', mockRender);

      expect(result).toBe('(value ? JSON.stringify(value) : value)');
    });

    it('should convert date to ISO string for non-nullable date column when stringifyDates is true', () => {
      const column = createMockColumnBaseModel({
        zodType: 'date',
        isNullable: false,
        isArray: false,
      });

      const configWithStringifyDates = { ...mockConfig, stringifyDates: true };
      const transform = createRenderWriteTransform(
        column,
        configWithStringifyDates
      );
      const result = transform()('dateValue', mockRender);

      expect(result).toBe('dateValue.toISOString()');
    });

    it('should conditionally convert date to ISO string for nullable date column when stringifyDates is true', () => {
      const column = createMockColumnBaseModel({
        zodType: 'date',
        isNullable: true,
        isArray: false,
      });

      const configWithStringifyDates = { ...mockConfig, stringifyDates: true };
      const transform = createRenderWriteTransform(
        column,
        configWithStringifyDates
      );
      const result = transform()('dateValue', mockRender);

      expect(result).toBe('(dateValue ? dateValue.toISOString() : dateValue)');
    });

    it('should map date array to ISO strings for non-nullable date array when stringifyDates is true', () => {
      const column = createMockColumnBaseModel({
        zodType: 'date',
        isNullable: false,
        isArray: true,
      });

      const configWithStringifyDates = { ...mockConfig, stringifyDates: true };
      const transform = createRenderWriteTransform(
        column,
        configWithStringifyDates
      );
      const result = transform()('dateArray', mockRender);

      expect(result).toBe('dateArray.map(date => date.toISOString())');
    });

    it('should conditionally map date array to ISO strings for nullable date array when stringifyDates is true', () => {
      const column = createMockColumnBaseModel({
        zodType: 'date',
        isNullable: true,
        isArray: true,
      });

      const configWithStringifyDates = { ...mockConfig, stringifyDates: true };
      const transform = createRenderWriteTransform(
        column,
        configWithStringifyDates
      );
      const result = transform()('dateArray', mockRender);

      expect(result).toBe(
        '(dateArray ? dateArray.map(date => date.toISOString()) : dateArray)'
      );
    });
  });

  describe('renderReadField', () => {
    it('should render basic string field', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
      });

      const result = renderReadField(column, mockConfig);
      expect(result).toBe('z.string()');
    });

    it('should render nullable string field', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: true,
        isArray: false,
      });

      const result = renderReadField(column, mockConfig);
      expect(result).toBe('z.string().nullable()');
    });

    it('should render array field', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: true,
      });

      const result = renderReadField(column, mockConfig);
      expect(result).toBe('z.array(z.string())');
    });

    it('should render nullable array field', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: true,
        isArray: true,
      });

      const result = renderReadField(column, mockConfig);
      expect(result).toBe('z.array(z.string()).nullable()');
    });

    it('should render enum field', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
        isEnum: true,
        enumConstantName: 'TEST_ENUM',
      });

      const result = renderReadField(column, mockConfig);
      expect(result).toBe('z.enum(TEST_ENUM)');
    });

    it('should render JSON field with schema import', () => {
      const column = createMockColumnBaseModel({
        zodType: 'json',
        isNullable: false,
        isArray: false,
        jsonSchemaName: 'CustomSchema',
      });

      const configWithJsonSchema = {
        ...mockConfig,
        jsonSchemaImportLocation: './schemas',
      };

      const result = renderReadField(column, configWithJsonSchema);
      expect(result).toBe('CustomSchema');
    });

    describe('zodType rendering with different versions', () => {
      it('should render email field for zod v3', () => {
        const column = createMockColumnBaseModel({
          zodType: 'email',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.string().email()');
      });

      it('should render email field for zod v4', () => {
        const column = createMockColumnBaseModel({
          zodType: 'email',
          isNullable: false,
          isArray: false,
        });

        const configV4 = { ...mockConfig, zodVersion: 4 as ZodPgZodVersion };
        const result = renderReadField(column, configV4);
        expect(result).toBe('z.email()');
      });

      it('should render url field for zod v3', () => {
        const column = createMockColumnBaseModel({
          zodType: 'url',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.string().url()');
      });

      it('should render url field for zod v4', () => {
        const column = createMockColumnBaseModel({
          zodType: 'url',
          isNullable: false,
          isArray: false,
        });

        const configV4 = { ...mockConfig, zodVersion: 4 as ZodPgZodVersion };
        const result = renderReadField(column, configV4);
        expect(result).toBe('z.url()');
      });

      it('should render int field for zod v3', () => {
        const column = createMockColumnBaseModel({
          zodType: 'int',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.number().int()');
      });

      it('should render int field for zod v4', () => {
        const column = createMockColumnBaseModel({
          zodType: 'int',
          isNullable: false,
          isArray: false,
        });

        const configV4 = { ...mockConfig, zodVersion: 4 as ZodPgZodVersion };
        const result = renderReadField(column, configV4);
        expect(result).toBe('z.int()');
      });

      it('should render uuid field for zod v3', () => {
        const column = createMockColumnBaseModel({
          zodType: 'uuid',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.string().uuid()');
      });

      it('should render uuid field for zod v4', () => {
        const column = createMockColumnBaseModel({
          zodType: 'uuid',
          isNullable: false,
          isArray: false,
        });

        const configV4 = { ...mockConfig, zodVersion: 4 as ZodPgZodVersion };
        const result = renderReadField(column, configV4);
        expect(result).toBe('z.uuid()');
      });

      it('should render json field for zod v3', () => {
        const column = createMockColumnBaseModel({
          zodType: 'json',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.any()');
      });

      it('should render json field for zod v4', () => {
        const column = createMockColumnBaseModel({
          zodType: 'json',
          isNullable: false,
          isArray: false,
        });

        const configV4 = { ...mockConfig, zodVersion: 4 as ZodPgZodVersion };
        const result = renderReadField(column, configV4);
        expect(result).toBe('z.json()');
      });

      it('should render number field', () => {
        const column = createMockColumnBaseModel({
          zodType: 'number',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.number()');
      });

      it('should render boolean field', () => {
        const column = createMockColumnBaseModel({
          zodType: 'boolean',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.boolean()');
      });

      it('should render date field', () => {
        const column = createMockColumnBaseModel({
          zodType: 'date',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.date()');
      });

      it('should render unknown type as z.any()', () => {
        const column = createMockColumnBaseModel({
          zodType: 'any',
          isNullable: false,
          isArray: false,
        });

        const result = renderReadField(column, mockConfig);
        expect(result).toBe('z.any()');
      });
    });
  });

  describe('renderWriteField', () => {
    it('should render basic string field with nullish for nullable', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: true,
        isArray: false,
      });

      const result = renderWriteField(column, mockConfig);
      expect(result).toBe('z.string().nullish()');
    });

    it('should render field with min length constraint', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
        minLen: 5,
      });

      const result = renderWriteField(column, mockConfig);
      expect(result).toBe('z.string().min(5)');
    });

    it('should render field with max length constraint', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
        maxLen: 100,
      });

      const result = renderWriteField(column, mockConfig);
      expect(result).toBe('z.string().max(100)');
    });

    it('should render field with both min and max length constraints', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
        minLen: 5,
        maxLen: 100,
      });

      const result = renderWriteField(column, mockConfig);
      expect(result).toBe('z.string().min(5).max(100)');
    });

    it('should render nullable field with min/max and nullish', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: true,
        isArray: false,
        minLen: 5,
        maxLen: 100,
      });

      const result = renderWriteField(column, mockConfig);
      expect(result).toBe('z.string().min(5).max(100).nullish()');
    });

    it('should not apply min/max constraints to enum fields', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
        isEnum: true,
        enumConstantName: 'TEST_ENUM',
        minLen: 5,
        maxLen: 100,
      });

      const result = renderWriteField(column, mockConfig);
      expect(result).toBe('z.enum(TEST_ENUM)');
    });

    it('should handle zero as valid min length', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
        minLen: 0,
      });

      const result = renderWriteField(column, mockConfig);
      expect(result).toBe('z.string().min(0)');
    });

    it('should handle undefined minLen/maxLen as no constraint', () => {
      const column = createMockColumnBaseModel({
        zodType: 'string',
        isNullable: false,
        isArray: false,
        minLen: undefined,
        maxLen: undefined,
      });

      const result = renderWriteField(column, mockConfig);
      expect(result).toBe('z.string()');
    });
  });
});

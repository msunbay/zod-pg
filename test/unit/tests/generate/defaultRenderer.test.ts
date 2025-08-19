import { describe, expect, it } from 'vitest';

import type {
  ZodPgColumnInfo,
  ZodPgConfig,
  ZodPgTableInfo,
} from '../../../../src/types.js';

import { DefaultRenderer } from '../../../../src/generate/renderers/DefaultRenderer.js';

// Helpers
const column = (overrides: Partial<ZodPgColumnInfo>): ZodPgColumnInfo => ({
  name: 'col',
  dataType: 'text',
  type: 'string',
  isEnum: false,
  isSerial: false,
  isArray: false,
  isNullable: false,
  isWritable: true,
  tableName: 'users',
  schemaName: 'public',
  tableType: 'table',
  ...overrides,
});

const table = (cols: ZodPgColumnInfo[]): ZodPgTableInfo => ({
  type: 'table',
  name: 'users',
  schemaName: 'public',
  columns: cols,
});

const baseConfig: ZodPgConfig = {
  connection: { connectionString: 'x', ssl: false },
  outputDir: '/tmp/ignore',
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
  defaultEmptyArray: true,
  stringifyDates: true,
};

describe('DefaultRenderer', () => {
  it('renders fallback types number, unknown, any', async () => {
    const tbl = table([
      column({ name: 'total', type: 'number', dataType: 'numeric' }),
      column({ name: 'mystery', type: 'unknown', dataType: 'unknown' }),
      column({ name: 'whatever', type: 'any', dataType: 'other' }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, baseConfig);
    expect(out).toContain('total: z.number()');
    expect(out).toContain('mystery: z.unknown()');
    expect(out).toContain('whatever: z.any()');
  });

  it('renders core zod types & array/nullish/optional transforms', async () => {
    const tbl = table([
      column({ name: 'id', type: 'int', dataType: 'int4', isSerial: true }),
      column({ name: 'email', type: 'email', dataType: 'varchar' }),
      column({
        name: 'profile',
        type: 'json',
        dataType: 'jsonb',
        isNullable: true,
        isOptional: true,
      }),
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
      column({
        name: 'tags',
        type: 'string',
        dataType: '_text',
        isArray: true,
        isNullable: true,
      }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, baseConfig);
    expect(out).toContain('id: z.number()');
    expect(out).toContain('email: z.string()');
    expect(out).toContain(
      'profile: z.any().nullish().transform((value) => value ?? undefined).optional()'
    );
    expect(out).toContain('created_at: z.coerce.date()');
    expect(out).toMatch(
      /tags: z\.array\(z\.string\(\)\)\.nullish\(\)\.transform\(\(value\) => value \?\? \[\]\)\.optional\(\)/
    );
  });

  it('honors disableCoerceDates for date fields', async () => {
    const tbl = table([
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, {
      ...baseConfig,
      disableCoerceDates: true,
    });
    expect(out).toContain('created_at: z.date()');
  });

  it('stringifies dates in write schema when stringifyDates is true', async () => {
    const tbl = table([
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, baseConfig);
    expect(out).toMatch(
      /createdAt: z\.date\(\)\.transform\(\(value\) => value\.toISOString\(\)\)/
    );
  });

  it('renders date arrays with stringifyDates (non-nullable & nullable)', async () => {
    const tbl = table([
      column({
        name: 'dates',
        type: 'date',
        dataType: 'timestamptz',
        isArray: true,
      }),
      column({
        name: 'dates_nullable',
        type: 'date',
        dataType: 'timestamptz',
        isArray: true,
        isNullable: true,
        isOptional: true,
      }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, baseConfig);
    // Read schema assertions (coerced dates, nullable with default [])
    expect(out).toMatch(/dates: z\.array\(z\.coerce\.date\(\)\)/);
    expect(out).toMatch(
      /dates_nullable: z\.array\(z\.coerce\.date\(\)\)\.nullish\(\)\.transform\(\(value\) => value \?\? \[\]\)\.optional\(\)/
    );
    // Write schema assertions (stringify logic)
    expect(out).toMatch(
      /dates: z\.array\(z\.date\(\)\)\.transform\(\(value\) => value\.map\(date => date\.toISOString\(\)\)\)/
    );
    expect(out).toMatch(
      /datesNullable: z\.array\(z\.date\(\)\)\.nullish\(\)\.transform\(\(value\) => value \? value\.map\(date => date\.toISOString\(\)\) : value\)\.optional\(\)/
    );
  });

  it('applies min/max length constraints on write schema only', async () => {
    const tbl = table([
      column({ name: 'username', type: 'string', minLen: 2, maxLen: 10 }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, baseConfig);
    expect(out).toMatch(/username: z\.string\(\)\.min\(2\)\.max\(10\)/);
  });

  it('omits length constraints for enums', async () => {
    const tbl = table([
      column({
        name: 'status',
        type: 'string',
        isEnum: true,
        enumValues: ['active', 'inactive'],
      }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, baseConfig);
    // Constant name uses singular table name + pluralized column? ensure presence of enum constant
    expect(out).toMatch(/export const USER_?STATUS/); // tolerant to naming variations
    expect(out).toMatch(/status: z\.enum\([A-Z0-9_]+\)/);
    // No min/max length chaining after enum
    const enumLine =
      out.split('\n').find((l) => /status: z\.enum/.test(l)) || '';
    expect(enumLine).not.toMatch(/\.min\(|\.max\(/);
  });

  it('creates json schema imports when configured', async () => {
    const tbl = table([
      column({ name: 'profile', type: 'json', dataType: 'jsonb' }),
      column({
        name: 'meta',
        type: 'json',
        dataType: 'json',
        isNullable: true,
      }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, {
      ...baseConfig,
      jsonSchemaImportLocation: '@schemas',
    });
    expect(out).toMatch(
      /import { UserProfileSchema, UserMetaSchema } from '@schemas'/
    );
    expect(out).toContain('profile: UserProfileSchema');
    expect(out).toMatch(
      /meta: UserMetaSchema\.nullish\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
  });

  it('respects disableStringifyJson flag', async () => {
    const tbl = table([
      column({ name: 'profile', type: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, {
      ...baseConfig,
      disableStringifyJson: true,
    });
    expect(out).not.toMatch(/JSON\.stringify/);
  });

  it('does not stringify nullable json when disableStringifyJson is true', async () => {
    const tbl = table([
      column({
        name: 'meta',
        type: 'json',
        dataType: 'jsonb',
        isNullable: true,
      }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, {
      ...baseConfig,
      disableStringifyJson: true,
    });
    // write schema should not contain JSON.stringify for meta
    expect(out).not.toMatch(/meta: .*JSON\.stringify/);
  });

  it('excludes non-writable columns (serial & non-table types) from write schema', async () => {
    const writable = column({ name: 'email', type: 'string' });
    const serial = column({
      name: 'id',
      type: 'int',
      isSerial: true,
      isWritable: false,
    });

    const tbl: ZodPgTableInfo = {
      type: 'table',
      name: 'users',
      schemaName: 'public',
      columns: [writable, serial],
    };

    const out = await new DefaultRenderer().renderSchema(tbl, baseConfig);

    // Extract write base schema object content
    const writeSectionMatch = out.match(
      /UsersTableInsertBaseSchema = z\.object\(\{([\s\S]*?)\n\}\);/
    );
    const writeContent = writeSectionMatch ? writeSectionMatch[1] : '';

    expect(writeContent).toContain('email: z.string()');
    expect(writeContent).not.toContain('id: z.number()');
  });

  it('applies all writeTransforms in order (trim, lowercase, uppercase, normalize, nonnegative)', async () => {
    const tbl = table([column({ name: 'value', type: 'int' })]);
    const out = await new DefaultRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: [
          'trim',
          'lowercase',
          'uppercase',
          'normalize',
          'nonnegative',
        ] as any,
      }),
    }).renderSchema(tbl, baseConfig);
    expect(out).toMatch(
      /value: z\.number\(\)\.trim\(\)\.lowercase\(\)\.uppercase\(\)\.normalize\(\)\.nonnegative\(\)/
    );
  });

  it('handles optional only (not nullable) field with correct transform logic', async () => {
    const tbl = table([
      column({
        name: 'nickname',
        type: 'string',
        isOptional: true,
        isNullable: false,
      }),
    ]);
    const out = await new DefaultRenderer().renderSchema(tbl, baseConfig);
    expect(out).toMatch(
      /nickname: z\.string\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
  });

  it('omits json schema import section when location configured but no json columns', async () => {
    const tbl = table([column({ name: 'username', type: 'string' })]);
    const out = await new DefaultRenderer().renderSchema(tbl, {
      ...baseConfig,
      jsonSchemaImportLocation: '@schemas',
    });
    expect(out).not.toMatch(/from '@schemas'/);
  });

  it('onColumnModelCreated and onTableModelCreated hooks modify output & re-render types', async () => {
    const tbl = table([column({ name: 'count', type: 'string' })]);
    const out = await new DefaultRenderer({
      onColumnModelCreated: (m) => ({ ...m, type: 'int' }),
      onTableModelCreated: (t) => ({
        ...t,
        tableReadSchemaName: 'CustomUsersSchema',
      }),
    }).renderSchema(tbl, baseConfig);
    expect(out).toContain('count: z.number()');
    expect(out).toContain('export const CustomUsersSchema');
  });

  it('uses schema.simple template when disableCaseTransform is true', async () => {
    const tbl = table([column({ name: 'id', type: 'int' })]);
    const out = await new DefaultRenderer().renderSchema(tbl, {
      ...baseConfig,
      disableCaseTransform: true,
    });
    expect(out).toContain('export const UsersTableSchema = z.object');
    expect(out).not.toContain('Base read schema');
  });
});

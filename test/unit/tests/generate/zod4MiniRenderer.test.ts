import { describe, expect, it } from 'vitest';

import type {
  ZodPgColumnInfo,
  ZodPgConfig,
  ZodPgTableInfo,
} from '../../../../src/types.js';

import { Zod4MiniRenderer } from '../../../../src/generate/renderers/Zod4MiniRenderer.js';

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
const config: ZodPgConfig = {
  outputDir: '/tmp/ignore',
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
  defaultEmptyArray: true,
  stringifyDates: true,
  stringifyJson: true,
  singularize: true,
  coerceDates: true,
  defaultNullsToUndefined: true,
  caseTransform: true,
};

describe('Zod4MiniRenderer', () => {
  it('imports from zod/mini and overrides types', async () => {
    const tbl = table([
      column({ name: 'email', type: 'email' }),
      column({ name: 'guid', type: 'uuid' }),
      column({ name: 'payload', type: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchema(tbl, config);
    expect(out).toContain("import { z } from 'zod/mini'");
    expect(out).toContain('email: z.email()');
    expect(out).toContain('guid: z.uuid()');
    expect(out).toContain('payload: z.json()');
  });

  it('applies pipe-based optional/nullable/default transforms for array', async () => {
    const tbl = table([
      column({
        name: 'tags',
        type: 'string',
        isArray: true,
        isNullable: true,
        isOptional: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchema(tbl, config);
    expect(out).toMatch(
      /tags: z\.pipe\(z\.optional\(z\.nullable\(z\.array\(z\.string\(\)\)\)\), z\.transform\(val => val \?\? \[\]\)\)/
    );
  });

  it('renders date arrays with stringifyDates true (non-nullable & nullable)', async () => {
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
    const out = await new Zod4MiniRenderer().renderSchema(tbl, config);
    // Read schema (coerce date arrays, nullable variant uses pipe(optional(nullable(array(coerce.date)))) with fallback [] )
    expect(out).toMatch(/dates: z\.array\(z\.coerce\.date\(\)\)/);
    expect(out).toMatch(
      /dates_nullable: z\.pipe\(z\.optional\(z\.nullable\(z\.array\(z\.coerce\.date\(\)\)\)\), z\.transform\(val => val \?\? \[\]\)\)/
    );
    // Write schema (pipe with z.date(), transform to ISO strings)
    expect(out).toMatch(
      /dates: z\.pipe\(z\.array\(z\.date\(\)\), z\.transform\(\(value\) => value\.map\(date => date\.toISOString\(\)\)\)\)/
    );
    expect(out).toMatch(
      /datesNullable: z\.pipe\(z\.optional\(z\.nullable\(z\.array\(z\.date\(\)\)\)\), z\.transform\(\(value\) => value \? value\.map\(date => date\.toISOString\(\)\) : value\)\)/
    );
  });

  it('applies all writeTransforms via .check wrappers', async () => {
    const tbl = table([column({ name: 'val', type: 'string' })]);
    const out = await new Zod4MiniRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase', 'uppercase', 'normalize'] as any,
      }),
    }).renderSchema(tbl, config);
    expect(out).toMatch(
      /val: z\.string\(\)(?:\.check\(z\.(?:trim|lowercase|uppercase|normalize)\(\)\)){4}/
    );
  });

  it('handles optional only (not nullable) field ordering', async () => {
    const tbl = table([
      column({
        name: 'nickname',
        type: 'string',
        isOptional: true,
        isNullable: false,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchema(tbl, config);
    // optional wraps the base type first, transform added after pipe
    expect(out).toMatch(
      /nickname: z\.pipe\(z\.optional\(z\.string\(\)\), z\.transform\(val => val \?\? undefined\)\)/
    );
  });

  it('does not include json import section when location provided but no json columns', async () => {
    const tbl = table([column({ name: 'username', type: 'string' })]);
    const out = await new Zod4MiniRenderer().renderSchema(tbl, {
      ...config,
      jsonSchemaImportLocation: '@schemas',
    });
    expect(out).not.toMatch(/from '@schemas'/);
  });

  it('does not stringify nullable json when stringifyJson is false', async () => {
    const tbl = table([
      column({
        name: 'meta',
        type: 'json',
        dataType: 'jsonb',
        isNullable: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchema(tbl, {
      ...config,
      stringifyJson: false,
    });
    expect(out).not.toMatch(/JSON\.stringify/);
  });

  it('write transforms use .check wrappers & min/max', async () => {
    const tbl = table([
      column({ name: 'username', type: 'string', minLen: 2, maxLen: 20 }),
    ]);
    const out = await new Zod4MiniRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase'] as any,
      }),
    }).renderSchema(tbl, config);
    expect(out).toMatch(
      /username: z\.string\(\)\.check\(z\.trim\(\)\)\.check\(z\.lowercase\(\)\)\.check\(z\.minLength\(2\)\)\.check\(z\.maxLength\(20\)\)/
    );
  });

  it('stringifies json in write schema when enabled', async () => {
    const tbl = table([
      column({ name: 'payload', type: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchema(tbl, config);
    expect(out).toMatch(
      /payload: z\.pipe\(z\.json\(\), z\.transform\(\(value\) => JSON\.stringify\(value\)\)\)/
    );
  });

  it('falls back to simple template when transformCasing is false', async () => {
    const tbl = table([column({ name: 'id', type: 'int', dataType: 'int4' })]);
    const out = await new Zod4MiniRenderer().renderSchema(tbl, {
      ...config,
      caseTransform: false,
    });
    expect(out).toContain("import { z } from 'zod'");
    expect(out).not.toContain('Base read schema');
  });
});

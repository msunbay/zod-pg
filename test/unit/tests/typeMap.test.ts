import { mapColumnType } from '../../../src/database/typeMap';

describe('mapColumnType', () => {
  it('should map known types to correct zod schemas', () => {
    expect(
      mapColumnType({
        dataType: 'integer',
        udtName: 'int4',
        name: 'id',
        isNullable: false,
        tableName: '',
        schemaName: '',
      })
    ).toBe('z.number().int()');
    expect(
      mapColumnType({
        dataType: 'varchar',
        udtName: 'varchar',
        name: 'name',
        isNullable: false,
        tableName: '',
        schemaName: '',
      })
    ).toBe('z.string()');
    expect(
      mapColumnType({
        dataType: 'jsonb',
        udtName: 'jsonb',
        name: 'meta',
        isNullable: true,
        tableName: '',
        schemaName: '',
      })
    ).toBe('z.any()');
    expect(
      mapColumnType({
        dataType: 'timestamptz',
        udtName: 'timestamptz',
        name: 'created_at',
        isNullable: false,
        tableName: '',
        schemaName: '',
      })
    ).toBe('z.date({ coerce: true })');
  });

  it('should default to z.any() for unknown types', () => {
    expect(
      mapColumnType({
        dataType: 'unknown_type',
        udtName: 'unknown',
        name: 'foo',
        isNullable: false,
        tableName: '',
        schemaName: '',
      })
    ).toBe('z.any()');
  });
});

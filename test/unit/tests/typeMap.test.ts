import { mapColumnType } from '../../../src/database/typeMap';

describe('mapColumnType', () => {
  it('should map known types to correct zod schemas', () => {
    expect(
      mapColumnType({
        dataType: 'integer',
        udtName: 'int4',
      })
    ).toBe('z.number().int()');
    expect(
      mapColumnType({
        dataType: 'varchar',
        udtName: 'varchar',
      })
    ).toBe('z.string()');
    expect(
      mapColumnType({
        dataType: 'jsonb',
        udtName: 'jsonb',
      })
    ).toBe('z.any()');
    expect(
      mapColumnType({
        dataType: 'timestamptz',
        udtName: 'timestamptz',
      })
    ).toBe('z.date({ coerce: true })');
  });

  it('should default to z.any() for unknown types', () => {
    expect(
      mapColumnType({
        dataType: 'unknown_type',
        udtName: 'unknown',
      })
    ).toBe('z.any()');
  });
});

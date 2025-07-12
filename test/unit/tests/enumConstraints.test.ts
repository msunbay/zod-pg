import { getEnumConstraints } from '../../../src/enumConstraints';

describe('getEnumConstraints', () => {
  it('should parse enum-like check constraints', async () => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            columnName: 'status',
            checkClause: "(status = ANY (ARRAY['active','inactive']))",
          },
          { columnName: 'type', checkClause: "(type IN ('foo','bar'))" },
        ],
      }),
    };
    const result = await getEnumConstraints({
      client: mockClient as any,
      schemaName: 'public',
      tableName: 'users',
    });
    expect(result.status).toEqual(['active', 'inactive']);
    expect(result.type).toEqual(['foo', 'bar']);
  });
});

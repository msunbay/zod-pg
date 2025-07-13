import { getEnumConstraints } from '../../../src/database/enumConstraints';

describe('getEnumConstraints', () => {
  it('should parse enum-like check constraints', () => {
    expect(
      getEnumConstraints('status', [
        "(status = ANY (ARRAY['active','inactive']))",
      ])
    ).toEqual(['active', 'inactive']);
    expect(getEnumConstraints('type', ["(type IN ('foo','bar'))"])).toEqual([
      'foo',
      'bar',
    ]);
  });
});

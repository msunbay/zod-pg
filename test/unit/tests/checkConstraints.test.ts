import { parseAnyArrayConstraint } from '../../../src/database/checks/anyArrayConstraint.js';

describe('parseArrayAnyConstraint', () => {
  it('parses a simple ANY ARRAY constraint', () => {
    const input =
      "((\"orchardBrand\" = ANY (ARRAY['orchard'::text, 'awal'::text, 'sme'::text])))";
    expect(parseAnyArrayConstraint(input)).toEqual(['orchard', 'awal', 'sme']);
  });

  it('parses with extra whitespace and no ::text', () => {
    const input = "(col = ANY (ARRAY['a', 'b', 'c']))";
    expect(parseAnyArrayConstraint(input)).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for non-matching constraint', () => {
    const input = "(col IN ('a', 'b'))";
    expect(parseAnyArrayConstraint(input)).toEqual([]);
  });

  it('parses with multiple parentheses', () => {
    const input =
      "((\"orchardBrand\" = ANY (ARRAY['orchard'::text, 'awal'::text, 'sme'::text])))";
    expect(parseAnyArrayConstraint(input)).toEqual(['orchard', 'awal', 'sme']);
  });

  it('parses with no parentheses at all', () => {
    const input = "col = ANY (ARRAY['x', 'y'])";
    expect(parseAnyArrayConstraint(input)).toEqual(['x', 'y']);
  });

  it('parses with "::character varying" type', () => {
    const input =
      "((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[]))";
    expect(parseAnyArrayConstraint(input)).toEqual([
      'draft',
      'published',
      'archived',
    ]);
  });
});

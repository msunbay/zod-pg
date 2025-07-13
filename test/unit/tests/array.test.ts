import { parsePgArray } from '../../../src/utils/pg';

describe('parsePgArray', () => {
  it('parses a simple array of quoted strings', () => {
    expect(parsePgArray('{"foo","bar","baz"}')).toEqual(['foo', 'bar', 'baz']);
  });

  it('parses a simple array of unquoted strings', () => {
    expect(parsePgArray('{foo,bar,baz}')).toEqual(['foo', 'bar', 'baz']);
  });

  it('parses an array with embedded commas in quoted strings', () => {
    expect(parsePgArray('{"foo,bar","baz"}')).toEqual(['foo,bar', 'baz']);
  });

  it('parses an array with empty string', () => {
    expect(parsePgArray('{"foo","","baz"}')).toEqual(['foo', '', 'baz']);
  });

  it('returns empty array for empty input', () => {
    expect(parsePgArray('{}')).toEqual([]);
    expect(parsePgArray('')).toEqual([]);
    expect(parsePgArray(null as any)).toEqual([]);
  });

  it('parses an array with whitespace and quotes', () => {
    expect(parsePgArray('{  "foo"  ,  "bar"  }')).toEqual(['foo', 'bar']);
  });

  it('parses an array with single element', () => {
    expect(parsePgArray('{"foo"}')).toEqual(['foo']);
  });

  it('parses an array with check constraints', () => {
    expect(
      parsePgArray(
        `{"((\"orchardBrand\" = ANY (ARRAY['orchard'::text, 'awal'::text, 'sme'::text])))"}`
      )
    ).toEqual([
      "((\"orchardBrand\" = ANY (ARRAY['orchard'::text, 'awal'::text, 'sme'::text])))",
    ]);
  });
});

/**
 * Match col = ANY (ARRAY['a','b'])
 * Extracts values from constraints like ((\"orchardBrand\" = ANY (ARRAY['orchard'::text, 'awal'::text, 'sme'::text])))
 */
export const parseAnyArrayConstraint = (constraint: string): string[] => {
  // Unescape any escaped quotes
  let clause = constraint.replace(/\\"/g, '"');
  // Remove all leading/trailing parentheses (robust for nested cases)
  while (clause.startsWith('(') && clause.endsWith(')')) {
    clause = clause.slice(1, -1);
  }

  // Match with or without parentheses around the whole expression
  const match = clause.match(
    /"?([a-zA-Z0-9_]+)"?\s*=\s*ANY\s*\(ARRAY\[(.*?)\]\)/
  );

  if (match) {
    return match[2].split(',').map((v) =>
      v
        .trim()
        .replace(/'::text/g, '')
        .replace(/'/g, '')
    );
  }

  return [];
};

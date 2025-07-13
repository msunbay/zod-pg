export function parsePgArray(str: string): string[] {
  // Remove curly braces at start/end, then split on comma not inside quotes
  if (!str || str === '{}') return [];

  // Remove outer braces
  const inner = str.slice(1, -1);

  // Split on "," that is not inside quotes
  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current) parts.push(current);

  // Remove wrapping quotes if present, and trim whitespace
  return parts.map((s) => s.trim().replace(/^"(.*)"$/, '$1'));
}

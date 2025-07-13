// Words that should not be transformed to singular form
const IGNORED_WORDS = ['status', 'business', 'data', 'bus'];

const KNOWN_IRREGULARS: Record<string, string> = {
  children: 'child',
  people: 'person',
  men: 'man',
  women: 'woman',
  feet: 'foot',
  teeth: 'tooth',
  geese: 'goose',
  mice: 'mouse',
  oxen: 'ox',
  criteria: 'criterion',
  indices: 'index',
  statuses: 'status',
  analyses: 'analysis',
  diagnoses: 'diagnosis',
  matrices: 'matrix',
  vertices: 'vertex',
  roles: 'role',
  cases: 'case',
};

export const singularize = (word: string): string => {
  const lowerWord = word.toLowerCase();

  if (IGNORED_WORDS.includes(lowerWord)) {
    return word;
  }

  if (KNOWN_IRREGULARS[lowerWord]) {
    return KNOWN_IRREGULARS[lowerWord];
  }

  // Plurals ending in 'ies'
  // e.g., 'categories' -> 'category'
  // e.g., 'companies' -> 'company'
  if (lowerWord.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }

  // Plurals ending in 'es'
  // e.g., 'boxes' -> 'box', 'buses' -> 'bus'
  // e.g., 'wishes' -> 'wish', 'churches' -> 'church'
  if (lowerWord.endsWith('es')) {
    return word.slice(0, -2);
  }

  // If ends with just 's' (but not 'ss'), remove the 's'
  // e.g., 'cats' -> 'cat', 'dogs' -> 'dog'
  // e.g., 'class' -> 'class', 'glass' -> 'glass'
  if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss')) {
    return word.slice(0, -1);
  }

  return word;
};

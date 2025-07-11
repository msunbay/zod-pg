// Words that should not be transformed to singular form
const IGNORED_WORDS = ["status", "business"];

const KNOWN_IRREGULARS: Record<string, string> = {
  children: "child",
};

export const singularize = (word: string): string => {
  const lowerWord = word.toLowerCase();

  if (IGNORED_WORDS.includes(lowerWord)) {
    return word;
  }

  if (KNOWN_IRREGULARS[lowerWord]) {
    return KNOWN_IRREGULARS[word];
  }

  // Basic english singularization logic
  if (lowerWord.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  } else if (lowerWord.endsWith("es")) {
    return word.slice(0, -2);
  } else if (lowerWord.endsWith("s")) {
    return word.slice(0, -1);
  }
  return word;
};

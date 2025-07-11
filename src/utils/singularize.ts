const IGNORED_WORDS = ["status"];

const KNOWN_IRREGULARS: Record<string, string> = {
  children: "child",
};

export const singularize = (word: string): string => {
  if (IGNORED_WORDS.includes(word.toLowerCase())) {
    return word;
  }

  if (KNOWN_IRREGULARS[word]) {
    return KNOWN_IRREGULARS[word];
  }

  const lowerWord = word.toLowerCase();

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

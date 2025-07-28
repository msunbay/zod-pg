export const mergeObjects = <T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T => {
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = source[key];

      if (value !== undefined) {
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          target[key] = mergeObjects(
            target[key] || ({} as T[typeof key]),
            value
          );
        } else {
          target[key] = value as T[typeof key];
        }
      }
    }
  }
  return target;
};

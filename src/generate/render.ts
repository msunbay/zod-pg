import {
  ZodPgColumnBaseModel,
  ZodPgColumnInfo,
  ZodPgColumnType,
  ZodPgConfig,
  ZodPgZodVersion,
} from '../types.js';

export const createRenderReadTransform = (
  column: ZodPgColumnInfo,
  config: ZodPgConfig
) => {
  return () => (text: string, render: (text: string) => string) => {
    const innerText = render(text);

    if (column.isNullable && column.isArray && config.defaultEmptyArray) {
      return `${innerText} ?? []`;
    }

    if (column.isNullable) {
      return `${innerText} ?? undefined`;
    }

    return innerText;
  };
};

export const createRenderWriteTransform = (
  column: ZodPgColumnBaseModel,
  config: ZodPgConfig
) => {
  return () => (text: string, render: (text: string) => string) => {
    const innerText = render(text);

    if (column.zodType === 'json' && config.stringifyJson) {
      if (!column.isNullable) return `JSON.stringify(${innerText})`;

      return `(${innerText} ? JSON.stringify(${innerText}) : ${innerText})`;
    }

    if (column.zodType === 'date' && config.stringifyDates) {
      if (column.isArray) {
        if (!column.isNullable)
          return `${innerText}.map(date => date.toISOString())`;
        return `(${innerText} ? ${innerText}.map(date => date.toISOString()) : ${innerText})`;
      }

      if (!column.isNullable) return `${innerText}.toISOString()`;
      return `(${innerText} ? ${innerText}.toISOString() : ${innerText})`;
    }

    return innerText;
  };
};

const renderZodType = (
  zodType: ZodPgColumnType,
  version?: ZodPgZodVersion
): string => {
  switch (zodType) {
    case 'string':
      return 'z.string()';
    case 'email':
      return version === 4 ? 'z.email()' : 'z.string().email()';
    case 'url':
      return version === 4 ? 'z.url()' : 'z.string().url()';
    case 'int':
      return version === 4 ? 'z.int()' : 'z.number().int()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'date':
      return 'z.date()';
    case 'uuid':
      return version === 4 ? 'z.uuid()' : 'z.string().uuid()';
    case 'json':
      return version === 4 ? 'z.json()' : 'z.any()';
    default:
      return 'z.any()';
  }
};

const renderReadWriteField = (
  column: ZodPgColumnBaseModel,
  config: ZodPgConfig
) => {
  let zodType = renderZodType(column.zodType, config.zodVersion);

  if (column.isEnum) zodType = `z.enum(${column.enumConstantName})`;

  if (column.isArray) zodType = `z.array(${zodType})`;

  if (
    column.zodType === 'json' &&
    config.jsonSchemaImportLocation &&
    column.jsonSchemaName
  ) {
    zodType = column.jsonSchemaName;
  }

  return zodType;
};

export const renderReadField = (
  column: ZodPgColumnBaseModel,
  config: ZodPgConfig
): string => {
  let zodType = renderReadWriteField(column, config);

  if (column.isNullable) {
    zodType = `${zodType}.nullable()`;
  }

  return zodType;
};

export const renderWriteField = (
  column: ZodPgColumnBaseModel,
  config: ZodPgConfig
): string => {
  let zodType = renderReadWriteField(column, config);

  if (column.minLen !== undefined && column.minLen !== null && !column.isEnum) {
    zodType = `${zodType}.min(${column.minLen})`;
  }

  if (column.maxLen !== undefined && column.maxLen !== null && !column.isEnum) {
    zodType = `${zodType}.max(${column.maxLen})`;
  }

  if (column.isNullable) {
    zodType = `${zodType}.nullish()`;
  }

  return zodType;
};

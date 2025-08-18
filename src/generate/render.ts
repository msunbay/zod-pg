import {
  ZodPgColumnBaseModel,
  ZodPgColumnInfo,
  ZodPgColumnType,
  ZodPgConfig,
} from '../types.js';

export const createRenderReadTransform = (
  _column: ZodPgColumnInfo,
  _config: ZodPgConfig
) => {
  return () => (text: string, render: (text: string) => string) => {
    return render(text);
  };
};

export const createRenderWriteTransform = (
  _column: ZodPgColumnBaseModel,
  _config: ZodPgConfig
) => {
  return () => (text: string, render: (text: string) => string) => {
    return render(text);
  };
};

const renderZodType = (
  zodType: ZodPgColumnType,
  config: ZodPgConfig,
  isReadField: boolean = false
): string => {
  const { zodVersion, disableCoerceDates } = config;

  switch (zodType) {
    case 'string':
      return 'z.string()';
    case 'email':
      return zodVersion === '4' ? 'z.email()' : 'z.string().email()';
    case 'url':
      return zodVersion === '4' ? 'z.url()' : 'z.string().url()';
    case 'int':
      return zodVersion === '4' ? 'z.int()' : 'z.number().int()';
    case 'number':
      return 'z.number()';
    case 'boolean':
      return 'z.boolean()';
    case 'date':
      return !disableCoerceDates && isReadField
        ? 'z.coerce.date()'
        : 'z.date()';
    case 'uuid':
      return zodVersion === '4' ? 'z.uuid()' : 'z.string().uuid()';
    case 'json':
      return zodVersion === '4' ? 'z.json()' : 'z.any()';
    default:
      return 'z.any()';
  }
};

export const renderReadField = (
  column: ZodPgColumnBaseModel,
  config: ZodPgConfig
): string => {
  let zodType = renderZodType(column.type, config, true);

  if (column.isEnum) zodType = `z.enum(${column.enumConstantName})`;
  if (column.isArray) zodType = `z.array(${zodType})`;

  if (
    column.type === 'json' &&
    config.jsonSchemaImportLocation &&
    column.jsonSchemaName
  ) {
    zodType = column.jsonSchemaName;
  }

  if (column.isNullable) {
    zodType = `${zodType}.nullish()`;
  }

  if (column.isOptional || column.isNullable) {
    if (column.isArray && config.defaultEmptyArray)
      zodType = `${zodType}.transform((value) => value ?? [])`;
    else zodType = `${zodType}.transform((value) => value ?? undefined)`;

    zodType = `${zodType}.optional()`;
  }

  return zodType;
};

export const renderWriteField = (
  column: ZodPgColumnBaseModel,
  config: ZodPgConfig
): string => {
  let zodType = renderZodType(column.type, config, false);

  if (column.isEnum) zodType = `z.enum(${column.enumConstantName})`;
  if (column.isArray) zodType = `z.array(${zodType})`;

  if (
    column.type === 'json' &&
    config.jsonSchemaImportLocation &&
    column.jsonSchemaName
  ) {
    zodType = column.jsonSchemaName;
  }

  if (column.minLen !== undefined && column.minLen !== null && !column.isEnum) {
    zodType = `${zodType}.min(${column.minLen})`;
  }

  if (column.maxLen !== undefined && column.maxLen !== null && !column.isEnum) {
    zodType = `${zodType}.max(${column.maxLen})`;
  }

  if (column.isNullable) {
    zodType = `${zodType}.nullish()`;
  }

  if (column.type === 'json' && !config.disableStringifyJson) {
    if (!column.isNullable)
      zodType = `${zodType}.transform((value) => JSON.stringify(value))`;
    else
      zodType = `${zodType}.transform((value) => value ? JSON.stringify(value) : value)`;
  }

  if (column.type === 'date' && config.stringifyDates) {
    if (column.isArray) {
      if (!column.isNullable)
        zodType = `${zodType}.transform((value) => value.map(date => date.toISOString()))`;
      else
        zodType = `${zodType}.transform((value) => value ? value.map(date => date.toISOString()) : value)`;
    } else {
      if (!column.isNullable)
        zodType = `${zodType}.transform((value) => value.toISOString())`;
      else
        zodType = `${zodType}.transform((value) => value ? value.toISOString() : value)`;
    }
  }

  if (column.isOptional) {
    zodType = `${zodType}.optional()`;
  }

  return zodType;
};

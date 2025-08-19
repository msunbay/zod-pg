import type {
  ZodPgColumnInfo,
  ZodPgColumnType,
  ZodPgConfig,
  ZodPgRenderer,
  ZodPgTableInfo,
} from '../../types.js';
import type {
  ZodPgColumn,
  ZodPgColumnBaseModel,
  ZodPgImport,
  ZodPgTable,
} from './types.js';

import { convertCaseFormat, formatSingularString } from '../../utils/casing.js';
import {
  formatEnumConstantName,
  formatEnumTypeName,
  formatJsonSchemaName,
  formatRecordTransformName,
  formatTableRecordName,
  formatTableSchemaName,
} from '../format.js';
import { renderTemplate } from '../template.js';

export interface DefaultRendererOptions {
  onColumnModelCreated?: (
    model: ZodPgColumn
  ) => ZodPgColumn | Promise<ZodPgColumn>;
  onTableModelCreated?: (model: ZodPgTable) => ZodPgTable | Promise<ZodPgTable>;
}

export class DefaultRenderer implements ZodPgRenderer {
  protected options: DefaultRendererOptions;

  constructor(options: DefaultRendererOptions = {}) {
    this.options = options;
  }

  protected getSchemaTemplateName(config: ZodPgConfig): string {
    if (config.disableCaseTransform) return 'schema.simple';
    return 'schema';
  }

  protected createRenderReadTransform(
    _column: ZodPgColumnInfo,
    _config: ZodPgConfig
  ) {
    return () => (text: string, render: (text: string) => string) => {
      return render(text);
    };
  }

  protected createRenderWriteTransform(
    _column: ZodPgColumnBaseModel,
    _config: ZodPgConfig
  ) {
    return () => (text: string, render: (text: string) => string) => {
      return render(text);
    };
  }

  /**
   * Takes a ZodPgColumnType and returns the corresponding Zod type string.
   * e.g 'z.string()' for 'string', 'z.number()' for 'number'.
   */
  protected renderZodType(
    zodType: ZodPgColumnType,
    config: ZodPgConfig,
    isReadField: boolean
  ): string {
    const { disableCoerceDates } = config;

    switch (zodType) {
      case 'string':
      case 'email':
      case 'url':
      case 'uuid':
        return 'z.string()';
      case 'int':
      case 'number':
        return 'z.number()';
      case 'boolean':
        return 'z.boolean()';
      case 'date':
        return !disableCoerceDates && isReadField
          ? 'z.coerce.date()'
          : 'z.date()';
      case 'unknown':
        return 'z.unknown()';
      default:
        return 'z.any()';
    }
  }

  protected renderReadField(
    column: ZodPgColumnBaseModel,
    config: ZodPgConfig
  ): string {
    let zodType = this.renderZodType(column.type, config, true);

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
  }

  protected renderWriteField(
    column: ZodPgColumnBaseModel,
    config: ZodPgConfig
  ): string {
    let zodType = this.renderZodType(column.type, config, false);

    if (column.writeTransforms?.includes('trim')) {
      zodType = `${zodType}.trim()`;
    }

    if (column.writeTransforms?.includes('lowercase')) {
      zodType = `${zodType}.lowercase()`;
    }

    if (column.writeTransforms?.includes('uppercase')) {
      zodType = `${zodType}.uppercase()`;
    }

    if (column.writeTransforms?.includes('normalize')) {
      zodType = `${zodType}.normalize()`;
    }

    if (column.writeTransforms?.includes('nonnegative')) {
      zodType = `${zodType}.nonnegative()`;
    }

    if (column.isEnum) zodType = `z.enum(${column.enumConstantName})`;
    if (column.isArray) zodType = `z.array(${zodType})`;

    if (
      column.type === 'json' &&
      config.jsonSchemaImportLocation &&
      column.jsonSchemaName
    ) {
      zodType = column.jsonSchemaName;
    }

    if (
      column.minLen !== undefined &&
      column.minLen !== null &&
      !column.isEnum
    ) {
      zodType = `${zodType}.min(${column.minLen})`;
    }

    if (
      column.maxLen !== undefined &&
      column.maxLen !== null &&
      !column.isEnum
    ) {
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
  }

  protected createColumnModel(
    column: ZodPgColumnInfo,
    config: ZodPgConfig
  ): ZodPgColumn {
    const baseModel = {
      propertyName: convertCaseFormat(column.name, config.fieldNameCasing),
      enumConstantName: formatEnumConstantName(column.tableName, column.name),
      jsonSchemaName: formatJsonSchemaName(
        column.tableName,
        column.name,
        config.objectNameCasing
      ),
      ...column,
    };

    return {
      ...baseModel,
      renderedReadType: this.renderReadField(baseModel, config),
      renderedWriteType: this.renderWriteField(baseModel, config),
    };
  }

  protected createJsonSchemaImports(
    columns: ZodPgColumn[],
    config: ZodPgConfig
  ): ZodPgImport[] | undefined {
    if (!config.jsonSchemaImportLocation) return undefined;

    const jsonFields = columns.filter(
      (col) => col.type === 'json' && col.jsonSchemaName
    );

    return jsonFields.map((col, index) => ({
      name: col.jsonSchemaName,
      last: index === jsonFields.length - 1,
    })) as ZodPgImport[];
  }

  protected createWritableColumns(columns: ZodPgColumn[]): ZodPgColumn[] {
    return columns.filter((column) => column.isWritable);
  }

  protected async createTableModel(
    tableInfo: ZodPgTableInfo,
    config: ZodPgConfig
  ): Promise<ZodPgTable> {
    const readableColumns: ZodPgColumn[] = [];

    for (const column of tableInfo.columns) {
      let model = this.createColumnModel(column, config);

      if (this.options.onColumnModelCreated) {
        const modifiedModel = await this.options.onColumnModelCreated(model);

        readableColumns.push({
          ...modifiedModel,

          // Need to re-render types and transforms after model modification,
          // except if they are already modified

          renderedReadType:
            modifiedModel.renderedReadType === model.renderedReadType
              ? this.renderReadField(modifiedModel, config)
              : modifiedModel.renderedReadType,

          renderedWriteType:
            modifiedModel.renderedWriteType === model.renderedWriteType
              ? this.renderWriteField(modifiedModel, config)
              : modifiedModel.renderedWriteType,
        });
      } else {
        readableColumns.push(model);
      }
    }

    const writableColumns = this.createWritableColumns(readableColumns);
    const jsonSchemaImports = this.createJsonSchemaImports(
      readableColumns,
      config
    );

    const enums = readableColumns
      .filter((column) => column.isEnum)
      .map((column) => {
        const enumValues = column.enumValues || [];

        return {
          constantName: column.enumConstantName!,
          typeName:
            column.enumTypeName ??
            formatEnumTypeName(
              column.tableName,
              column.name,
              config.objectNameCasing
            ),
          values: enumValues.map((value, index) => ({
            value,
            last: index === enumValues.length - 1,
          })),
        };
      });

    const tableModel: ZodPgTable = {
      type: tableInfo.type,
      tableName: tableInfo.name,
      schemaName: tableInfo.schemaName,
      tableSingularName: formatSingularString(
        tableInfo.name,
        config.objectNameCasing
      ),
      tableReadBaseSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'read',
        casing: config.objectNameCasing,
        suffix: 'BaseSchema',
      }),
      tableInsertBaseSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
        suffix: 'BaseSchema',
      }),
      tableReadTransformName: formatRecordTransformName({
        tableInfo,
        operation: 'read',
        casing: config.fieldNameCasing,
      }),
      tableInsertTransformName: formatRecordTransformName({
        tableInfo,
        operation: 'insert',
        casing: config.fieldNameCasing,
      }),
      tableUpdateTransformName: formatRecordTransformName({
        tableInfo,
        operation: 'update',
        casing: config.fieldNameCasing,
      }),
      tableReadSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'read',
        casing: config.objectNameCasing,
      }),
      tableInsertSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
      }),
      tableUpdateSchemaName: formatTableSchemaName({
        tableInfo,
        operation: 'update',
        casing: config.objectNameCasing,
      }),
      tableInsertRecordName: formatTableRecordName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
      }),
      tableReadBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'read',
        casing: config.objectNameCasing,
        suffix: 'BaseRecord',
      }),
      tableInsertBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
        suffix: 'BaseRecord',
      }),
      tableUpdateBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'update',
        casing: config.objectNameCasing,
        suffix: 'BaseRecord',
      }),
      tableReadRecordName: formatTableRecordName({
        tableInfo,
        operation: 'read',
        casing: config.objectNameCasing,
      }),
      tableUpdateRecordName: formatTableRecordName({
        tableInfo,
        operation: 'update',
        casing: config.objectNameCasing,
      }),
      jsonSchemaImportLocation: config.jsonSchemaImportLocation,
      jsonSchemaImports,
      hasJsonSchemaImports: !!jsonSchemaImports?.length,
      readableColumns,
      writableColumns,
      enums,
      isWritable: writableColumns.length > 0,
    };

    if (this.options.onTableModelCreated) {
      return await this.options.onTableModelCreated(tableModel);
    }

    return tableModel;
  }

  public async renderSchema(
    table: ZodPgTableInfo,
    config: ZodPgConfig
  ): Promise<string> {
    const templateName = this.getSchemaTemplateName(config);
    const model = await this.createTableModel(table, config);

    return await renderTemplate(templateName, model);
  }
}

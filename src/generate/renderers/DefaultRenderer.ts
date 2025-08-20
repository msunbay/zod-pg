import type {
  ZodPgColumnInfo,
  ZodPgColumnType,
  ZodPgConfig,
  ZodPgRenderer,
  ZodPgTableInfo,
} from '../../types.js';
import type {
  ZodPgColumnBaseRenderModel,
  ZodPgColumnBaseType,
  ZodPgColumnRenderModel,
  ZodPgImport,
  ZodPgTableRenderModel,
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
    model: ZodPgColumnRenderModel
  ) => ZodPgColumnRenderModel | Promise<ZodPgColumnRenderModel>;
  onTableModelCreated?: (
    model: ZodPgTableRenderModel
  ) => ZodPgTableRenderModel | Promise<ZodPgTableRenderModel>;
}

export class DefaultRenderer implements ZodPgRenderer {
  protected options: DefaultRendererOptions;

  constructor(options: DefaultRendererOptions = {}) {
    this.options = options;
  }

  protected getSchemaTemplateName(config: ZodPgConfig): string {
    if (!config.caseTransform) return 'schema.simple';
    return 'schema';
  }

  /**
   * Returns the base type for a ZodPgColumnType.
   * Used to determine how to render the Zod type.
   * E.g. minLen/maxLen constraints are only applied to string/number types.
   */
  protected getBaseType(type: ZodPgColumnType): ZodPgColumnBaseType {
    switch (type) {
      case 'string':
      case 'email':
      case 'url':
      case 'uuid':
        return 'string';
      case 'int':
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'date';
      case 'json':
        return 'object';
      default:
        return 'unknown';
    }
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
    const { coerceDates, defaultUnknown } = config;

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
        return coerceDates && isReadField ? 'z.coerce.date()' : 'z.date()';
      case 'unknown':
        return 'z.unknown()';
      default:
        return defaultUnknown ? 'z.unknown()' : 'z.any()';
    }
  }

  protected renderReadField(
    column: ZodPgColumnBaseRenderModel,
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
      zodType = `${zodType}.nullable()`;
    }

    if (column.isOptional || column.isNullable) {
      if (column.isArray && config.defaultEmptyArray)
        zodType = `${zodType}.transform((value) => value ?? [])`;
      else if (config.defaultNullsToUndefined)
        zodType = `${zodType}.transform((value) => value ?? undefined)`;

      if (column.isOptional) {
        zodType = `${zodType}.optional()`;
      }
    }

    return zodType;
  }

  protected renderWriteField(
    column: ZodPgColumnBaseRenderModel,
    config: ZodPgConfig
  ): string {
    let zodType = this.renderZodType(column.type, config, false);
    const baseType = this.getBaseType(column.type);

    if (baseType === 'string' && !column.isEnum) {
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
    }

    if (baseType === 'number' && !column.isEnum) {
      if (column.writeTransforms?.includes('nonnegative')) {
        zodType = `${zodType}.nonnegative()`;
      }
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

    if (!column.isEnum && (baseType === 'string' || baseType === 'number')) {
      if (column.minLen !== undefined && column.minLen !== null) {
        zodType = `${zodType}.min(${column.minLen})`;
      }

      if (column.maxLen !== undefined && column.maxLen !== null) {
        zodType = `${zodType}.max(${column.maxLen})`;
      }
    }

    if (column.isNullable) {
      zodType = `${zodType}.nullable()`;
    }

    if (column.type === 'json' && config.stringifyJson) {
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
  ): ZodPgColumnRenderModel {
    const baseModel = {
      propertyName: convertCaseFormat(column.name, config.fieldNameCasing),
      enumConstantName: formatEnumConstantName({
        tableName: column.tableName,
        colName: column.name,
        singularize: config.singularize,
      }),
      jsonSchemaName: formatJsonSchemaName({
        tableName: column.tableName,
        columnName: column.name,
        casing: config.objectNameCasing,
        singularize: config.singularize,
      }),
      ...column,
    };

    return {
      ...baseModel,
      renderedReadType: this.renderReadField(baseModel, config),
      renderedWriteType: this.renderWriteField(baseModel, config),
    };
  }

  protected createJsonSchemaImports(
    columns: ZodPgColumnRenderModel[],
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

  protected createWritableColumns(
    columns: ZodPgColumnRenderModel[]
  ): ZodPgColumnRenderModel[] {
    return columns.filter((column) => column.isWritable);
  }

  protected async createTableModel(
    tableInfo: ZodPgTableInfo,
    config: ZodPgConfig
  ): Promise<ZodPgTableRenderModel> {
    const readableColumns: ZodPgColumnRenderModel[] = [];

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
            formatEnumTypeName({
              tableName: column.tableName,
              colName: column.name,
              casing: config.objectNameCasing,
              singularize: config.singularize,
            }),
          values: enumValues.map((value, index) => ({
            value,
            last: index === enumValues.length - 1,
          })),
        };
      });

    const tableModel: ZodPgTableRenderModel = {
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
        singularize: config.singularize,
      }),
      tableInsertTransformName: formatRecordTransformName({
        tableInfo,
        operation: 'insert',
        casing: config.fieldNameCasing,
        singularize: config.singularize,
      }),
      tableUpdateTransformName: formatRecordTransformName({
        tableInfo,
        operation: 'update',
        casing: config.fieldNameCasing,
        singularize: config.singularize,
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
        singularize: config.singularize,
      }),
      tableReadBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'read',
        casing: config.objectNameCasing,
        singularize: config.singularize,
        suffix: 'BaseRecord',
      }),
      tableInsertBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'insert',
        casing: config.objectNameCasing,
        singularize: config.singularize,
        suffix: 'BaseRecord',
      }),
      tableUpdateBaseRecordName: formatTableRecordName({
        tableInfo,
        operation: 'update',
        casing: config.objectNameCasing,
        singularize: config.singularize,
        suffix: 'BaseRecord',
      }),
      tableReadRecordName: formatTableRecordName({
        tableInfo,
        operation: 'read',
        singularize: config.singularize,
        casing: config.objectNameCasing,
      }),
      tableUpdateRecordName: formatTableRecordName({
        tableInfo,
        operation: 'update',
        singularize: config.singularize,
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

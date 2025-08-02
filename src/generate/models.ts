import {
  ZodPgColumn,
  ZodPgColumnInfo,
  ZodPgConfig,
  ZodPgImport,
  ZodPgTable,
  ZodPgTableInfo,
} from '../types.js';
import { convertCaseFormat, formatSingularString } from '../utils/casing.js';
import {
  formatEnumConstantName,
  formatEnumTypeName,
  formatJsonSchemaName,
  formatTableRecordName,
  formatTableSchemaName,
} from './format.js';
import {
  createRenderReadTransform,
  createRenderWriteTransform,
  renderReadField,
  renderWriteField,
} from './render.js';

const createColumnModel = (
  column: ZodPgColumnInfo,
  config: ZodPgConfig
): ZodPgColumn => {
  const baseModel = {
    propertyName: convertCaseFormat(column.name, config.fieldNameCasing),
    enumConstantName: formatEnumConstantName(column.tableName, column.name),
    jsonSchemaName: formatJsonSchemaName(
      column.tableName,
      column.name,
      config.objectNameCasing
    ),
    isWritable: !column.isSerial && column.tableType === 'table',
    ...column,
  };

  return {
    ...baseModel,
    renderedReadType: renderReadField(baseModel, config),
    renderedWriteType: renderWriteField(baseModel, config),
    renderedReadTransform: createRenderReadTransform(baseModel, config),
    renderedWriteTransform: createRenderWriteTransform(baseModel, config),
  };
};

const createJsonSchemaImports = (
  columns: ZodPgColumn[],
  config: ZodPgConfig
): ZodPgImport[] | undefined => {
  if (!config.jsonSchemaImportLocation) return undefined;

  const jsonFields = columns.filter(
    (col) => col.type === 'json' && col.jsonSchemaName
  );

  return jsonFields.map((col, index) => ({
    name: col.jsonSchemaName,
    last: index === jsonFields.length - 1,
  })) as ZodPgImport[];
};

const createWritableColumns = (columns: ZodPgColumn[]): ZodPgColumn[] => {
  return columns.filter((column) => column.isWritable);
};

export const createTableModel = async (
  tableInfo: ZodPgTableInfo,
  config: ZodPgConfig
): Promise<ZodPgTable> => {
  const readableColumns: ZodPgColumn[] = [];

  for (const column of tableInfo.columns) {
    let model = createColumnModel(column, config);

    if (config.onColumnModelCreated) {
      const modifiedModel = await config.onColumnModelCreated(model);

      readableColumns.push({
        ...modifiedModel,

        // Need to re-render types and transforms after model modification,
        // except if they are already modified

        renderedReadType:
          modifiedModel.renderedReadType === model.renderedReadType
            ? renderReadField(model, config)
            : modifiedModel.renderedReadType,

        renderedWriteType:
          modifiedModel.renderedWriteType === model.renderedWriteType
            ? renderWriteField(model, config)
            : modifiedModel.renderedWriteType,

        renderedReadTransform:
          modifiedModel.renderedReadTransform === model.renderedReadTransform
            ? createRenderReadTransform(model, config)
            : modifiedModel.renderedReadTransform,

        renderedWriteTransform:
          modifiedModel.renderedWriteTransform === model.renderedWriteTransform
            ? createRenderWriteTransform(model, config)
            : modifiedModel.renderedWriteTransform,
      });
    } else {
      readableColumns.push(model);
    }
  }

  const writableColumns = createWritableColumns(readableColumns);
  const jsonSchemaImports = createJsonSchemaImports(readableColumns, config);

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
    tableReadSchemaName: formatTableSchemaName(
      tableInfo,
      'read',
      config.objectNameCasing
    ),
    tableInsertSchemaName: formatTableSchemaName(
      tableInfo,
      'insert',
      config.objectNameCasing
    ),
    tableUpdateSchemaName: formatTableSchemaName(
      tableInfo,
      'update',
      config.objectNameCasing
    ),

    tableInsertRecordName: formatTableRecordName(
      tableInfo,
      'insert',
      config.objectNameCasing
    ),
    tableReadRecordName: formatTableRecordName(
      tableInfo,
      'read',
      config.objectNameCasing
    ),
    tableUpdateRecordName: formatTableRecordName(
      tableInfo,
      'update',
      config.objectNameCasing
    ),
    jsonSchemaImportLocation: config.jsonSchemaImportLocation,
    jsonSchemaImports,
    hasJsonSchemaImports: !!jsonSchemaImports?.length,
    readableColumns,
    writableColumns,
    enums,
    isWritable: writableColumns.length > 0,
  };

  if (config.onTableModelCreated) {
    return await config.onTableModelCreated(tableModel);
  }

  return tableModel;
};

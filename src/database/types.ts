export interface SchemaInfo {
  name: string;
  tables: TableInfo[];
}

export interface TableInfo {
  name: string;
  schemaName: string;
  columns: ColumnInfo[];
}

export interface RawColumnInfo {
  name: string;
  dataType: string;
  defaultValue?: string;
  isNullable: boolean;
  maxLen?: number;
  minLen?: number;
  udtName: string;
  tableName: string;
  schemaName: string;
  checkConstraints?: { checkClause: string }[];
}

export interface ColumnInfo extends RawColumnInfo {
  isEnum: boolean;
  isSerial: boolean;
  allowedValues?: string[];
}

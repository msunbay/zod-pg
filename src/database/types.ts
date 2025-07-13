export interface SchemaInfo {
  name: string;
  tables: TableInfo[];
}

export interface TableInfo {
  name: string;
  schemaName: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  allowedValues?: string[];
  name: string;
  dataType: string;
  isNullable: boolean;
  maxLen?: number;
  minLen?: number;
  udtName: string;
  tableName: string;
  schemaName: string;
  checkConstraints?: string;
}

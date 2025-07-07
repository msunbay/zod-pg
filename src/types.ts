export interface ColumnInfo {
  name: string;
  dataType: string;
  isNullable: 'YES' | 'NO';
  maxLen?: number;
  udtName: string;
}

export interface CheckConstraint {
  columnName: string;
  checkClause: string;
}

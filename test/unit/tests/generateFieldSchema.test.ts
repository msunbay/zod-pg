import { ColumnInfo, TableInfo } from '../../../src/database/types';
import {
  createInputSchemaFields,
  createOutputSchemaFields,
  getEnums,
} from '../../../src/generate/generateFieldSchema';

describe('getEnums', () => {
  it('should generate enum literals and types', () => {
    const enums = getEnums({
      name: 'users',
      schemaName: 'public',
      columns: [
        {
          name: 'status',
          allowedValues: ['active', 'inactive'],
          dataType: '',
          isNullable: false,
          udtName: '',
          tableName: '',
          schemaName: '',
          isEnum: false,
          isSerial: false,
        },
      ],
    });

    expect(enums.enumLiterals[0]).toContain('export const USER_STATUS');
    expect(enums.enumTypes[0]).toContain('export type UserStatus');
  });
});

describe('createInputSchemaFields', () => {
  it('should generate input schema fields', () => {
    const columns: ColumnInfo[] = [
      {
        name: 'name',
        dataType: 'varchar',
        isNullable: false,
        udtName: 'varchar',
        tableName: '',
        schemaName: '',
        isEnum: false,
        isSerial: false,
      },
      {
        name: 'status',
        dataType: 'varchar',
        isNullable: true,
        udtName: 'varchar',
        tableName: '',
        schemaName: '',
        isEnum: false,
        isSerial: false,
      },
    ];

    const table: TableInfo = {
      name: 'users',
      schemaName: 'public',
      columns,
    };

    const result = createInputSchemaFields({
      table,
      useJsonSchemaImports: false,
    });

    expect(result).toContain('name: z.string()');
    expect(result).toContain('status: z.string().nullable().optional()');
  });
});

describe('createOutputSchemaFields', () => {
  it('should generate output schema fields', () => {
    const columns: ColumnInfo[] = [
      {
        name: 'name',
        dataType: 'varchar',
        isNullable: false,
        udtName: 'varchar',
        tableName: '',
        schemaName: '',
        isEnum: false,
        isSerial: false,
      },
      {
        name: 'status',
        dataType: 'varchar',
        isNullable: true,
        udtName: 'varchar',
        tableName: '',
        schemaName: '',
        isEnum: false,
        isSerial: false,
      },
    ];

    const table: TableInfo = {
      name: 'users',
      schemaName: 'public',
      columns,
    };

    const result = createOutputSchemaFields({
      table,
      useJsonSchemaImports: false,
    });
    expect(result).toContain('name: z.string()');
    expect(result).toContain(
      'status: z.string().nullable().optional().transform'
    );
  });
});

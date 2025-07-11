import {
  getEnums,
  createInputSchemaFields,
  createOutputSchemaFields,
} from "../../src/generateFieldSchema";
import { ColumnInfo } from "../../src/types";

describe("getEnums", () => {
  it("should generate enum literals and types", () => {
    const enums = getEnums("users", { status: ["active", "inactive"] });
    expect(enums.enumLiterals[0]).toContain("export const USER_STATUS");
    expect(enums.enumTypes[0]).toContain("export type UserStatus");
  });
});

describe("createInputSchemaFields", () => {
  it("should generate input schema fields", () => {
    const columns: ColumnInfo[] = [
      {
        name: "name",
        dataType: "varchar",
        isNullable: "NO",
        udtName: "varchar",
      },
      {
        name: "status",
        dataType: "varchar",
        isNullable: "YES",
        udtName: "varchar",
      },
    ];
    const result = createInputSchemaFields({
      columns,
      tableName: "users",
      enumConstraints: {},
      useJsonSchemaImports: false,
    });
    expect(result).toContain("name: z.string()");
    expect(result).toContain("status: z.string().nullable().optional()");
  });
});

describe("createOutputSchemaFields", () => {
  it("should generate output schema fields", () => {
    const columns: ColumnInfo[] = [
      {
        name: "name",
        dataType: "varchar",
        isNullable: "NO",
        udtName: "varchar",
      },
      {
        name: "status",
        dataType: "varchar",
        isNullable: "YES",
        udtName: "varchar",
      },
    ];
    const result = createOutputSchemaFields({
      columns,
      tableName: "users",
      enumConstraints: {},
      useJsonSchemaImports: false,
    });
    expect(result).toContain("name: z.string()");
    expect(result).toContain(
      "status: z.string().nullable().optional().transform"
    );
  });
});

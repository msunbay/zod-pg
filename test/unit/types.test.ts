import type { ColumnInfo, CheckConstraint } from "../../src/types";

describe("types", () => {
  it("ColumnInfo type should have required fields", () => {
    const col: ColumnInfo = {
      name: "id",
      dataType: "integer",
      isNullable: "NO",
      udtName: "int4",
    };
    expect(col.name).toBe("id");
    expect(col.dataType).toBe("integer");
    expect(col.isNullable).toBe("NO");
    expect(col.udtName).toBe("int4");
  });

  it("CheckConstraint type should have required fields", () => {
    const cc: CheckConstraint = {
      columnName: "status",
      checkClause: "status IN ('active','inactive')",
    };
    expect(cc.columnName).toBe("status");
    expect(cc.checkClause).toContain("IN");
  });
});

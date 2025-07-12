import { mapColumnType } from "../../../src/typeMap";

describe("mapColumnType", () => {
  it("should map known types to correct zod schemas", () => {
    expect(
      mapColumnType(
        { dataType: "integer", udtName: "int4", name: "id", isNullable: "NO" },
        "users"
      )
    ).toBe("z.number().int()");
    expect(
      mapColumnType(
        {
          dataType: "varchar",
          udtName: "varchar",
          name: "name",
          isNullable: "NO",
        },
        "users"
      )
    ).toBe("z.string()");
    expect(
      mapColumnType(
        {
          dataType: "jsonb",
          udtName: "jsonb",
          name: "meta",
          isNullable: "YES",
        },
        "users"
      )
    ).toBe("z.any()");
    expect(
      mapColumnType(
        {
          dataType: "timestamptz",
          udtName: "timestamptz",
          name: "created_at",
          isNullable: "NO",
        },
        "users"
      )
    ).toBe("z.date({ coerce: true })");
  });

  it("should default to z.any() for unknown types", () => {
    expect(
      mapColumnType(
        {
          dataType: "unknown_type",
          udtName: "unknown",
          name: "foo",
          isNullable: "NO",
        },
        "users"
      )
    ).toBe("z.any()");
  });
});

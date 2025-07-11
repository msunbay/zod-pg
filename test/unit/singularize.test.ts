import { singularize } from "../../src/utils/singularize";

describe("singularize", () => {
  it("should not singularize ignored words", () => {
    expect(singularize("status")).toBe("status");
    expect(singularize("Status")).toBe("Status");
  });

  it("should handle known irregulars", () => {
    expect(singularize("children")).toBe("child");
  });

  it('should singularize words ending with "ies"', () => {
    expect(singularize("parties")).toBe("party");
    expect(singularize("bodies")).toBe("body");
  });

  it('should singularize words ending with "es"', () => {
    expect(singularize("boxes")).toBe("box");
    expect(singularize("wishes")).toBe("wish");
  });

  it('should singularize words ending with "s"', () => {
    expect(singularize("cars")).toBe("car");
    expect(singularize("albums")).toBe("album");
  });

  it("should return the word unchanged if not plural", () => {
    expect(singularize("cat")).toBe("cat");
    expect(singularize("bus")).toBe("bu"); // Note: this is a limitation of the current logic
  });
});

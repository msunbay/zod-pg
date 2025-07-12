import { dirname } from "path";
import { generateTablesIndexFile } from "../../../src/generateIndexFile";
import { mkdirSync, readFileSync, rmSync } from "fs";

describe("generateTablesIndexFile", () => {
  const outputPath = "./test/tmp";
  const tableNames = ["users", "accounts"];
  const filePath = `${outputPath}/tables/index.ts`;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    // Ensure output and tables directories exist
    mkdirSync(dirname(filePath), { recursive: true });
  });

  afterEach(() => {
    // Remove the generated file and its parent directories
    try {
      rmSync(outputPath, { recursive: true });
    } catch {}
  });

  it("should generate an index file exporting all tables", async () => {
    await generateTablesIndexFile(outputPath, tableNames);

    const content = readFileSync(filePath, "utf8");
    expect(content).toContain("export * from './users';");
    expect(content).toContain("export * from './accounts';");
  });
});

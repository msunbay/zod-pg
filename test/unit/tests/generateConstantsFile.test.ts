import { generateConstantsFile } from "../../../src/generateConstantsFile";
import { mkdirSync, readFileSync, rmSync } from "fs";

describe("generateConstantsFile", () => {
  const outputPath = "./test/tmp";
  const tableNames = ["users", "accounts"];
  const filePath = `${outputPath}/constants.ts`;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    mkdirSync(outputPath, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(outputPath, { recursive: true });
    } catch {}
  });

  it("should generate a constants file", async () => {
    await generateConstantsFile(outputPath, tableNames);
    const content = readFileSync(filePath, "utf8");
    expect(content).toContain("export const TABLE_USERS = 'users';");
    expect(content).toContain("export const TABLE_ACCOUNTS = 'accounts';");
  });
});

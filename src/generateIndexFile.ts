import { writeFileSync } from "fs";

export const generateTablesIndexFile = async (
  outputPath: string,
  tableNames: string[]
) => {
  // generate index file
  const indexContent = tableNames
    .map((name) => `export * from './${name}';`)
    .join("\n");

  const indexFilePath = `${outputPath}/tables/index.ts`;
  writeFileSync(indexFilePath, indexContent);

  console.log(`Generated index file at ${indexFilePath}`);
};

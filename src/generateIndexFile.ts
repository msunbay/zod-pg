import { writeFileSync } from "fs";

export const generateIndexFile = async (
  outputPath: string,
  tableNames: string[]
) => {
  // generate index file
  const indexContent = tableNames
    .map((name) => `export * from './${name}';`)
    .join("\n");

  const indexFilePath = `${outputPath}/index.ts`;
  writeFileSync(indexFilePath, indexContent);

  console.log(`Generated index file at ${indexFilePath}`);
};

import { writeFileSync } from "fs";
import { singularPascalCase, singularUpperCase } from "./utils";

/*
declare module 'knex/types/tables' {
  interface Tables {
    users: UserRecord;
  }
}
 */

export const generateKnexTypesFile = async (
  outputPath: string,
  tableNames: string[]
) => {
  const imports = tableNames
    .map(
      (name) =>
        `import type { ${singularPascalCase(name)}Record } from './${name}';`
    )
    .join("\n");

  const types = tableNames
    .map((name) => `    ${name}: ${singularPascalCase(name)}Record;`)
    .join("\n");

  const indexFilePath = `${outputPath}/knex.d.ts`;
  writeFileSync(
    indexFilePath,
    `
${imports}

declare module 'knex/types/tables' {
  interface Tables {
${types}
  }
}
`
  );

  console.log(`Generated types file at ${indexFilePath}`);
};

export const generateTypesFile = async (
  outputPath: string,
  tableNames: string[]
) => {
  const types = tableNames.map((name) => `  | '${name}'`).join("\n");

  const indexFilePath = `${outputPath}/types.ts`;
  writeFileSync(
    indexFilePath,
    `export type Table = 
${types};\n`
  );

  console.log(`Generated types file at ${indexFilePath}`);
};

export const generateConstantsFile = async (
  outputPath: string,
  tableNames: string[]
) => {
  const consts = tableNames
    .map((name) => `export const TABLE_${singularUpperCase(name)} = '${name}';`)
    .join("\n");

  const indexFilePath = `${outputPath}/constants.ts`;
  writeFileSync(indexFilePath, `${consts}\n`);

  console.log(`Generated constants file at ${indexFilePath}`);
};

import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../src/generateZodSchemas';
import {
  getClientConnectionString,
  getOutputFiles,
  outputDir,
} from '../testDbUtils';

it('generates correct zod schemas', async () => {
  const connectionString = getClientConnectionString();

  await generateZodSchemas({
    connectionString,
    outputDir,
    jsonSchemaImportLocation: '../../json',
  });

  const outputFiles = getOutputFiles();

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});

import fs from 'fs';
import path from 'path';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

import { generateSchemas } from '../../../src/generateSchemas';

jest.setTimeout(60000);

let container: StartedPostgreSqlContainer;
let client: Client;
const outputDir = path.resolve(__dirname, '../output/generated');

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres').start();

  client = new Client({
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  });

  await client.connect();

  // Create schema
  const schemaSql = fs.readFileSync(
    path.resolve(__dirname, '../schema.sql'),
    'utf8'
  );

  await client.query(schemaSql);

  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(async () => {
  await client.end();
  await container.stop();
});

it('generates correct zod schemas', async () => {
  await generateSchemas({
    connectionString: `postgres://${client.user}:${client.password}@${client.host}:${client.port}/${client.database}`,
    outputDir,
    jsonSchemaImportLocation: '../../json',
  });

  function getAllFiles(dir: string): string[] {
    let results: string[] = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of list) {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        results = results.concat(getAllFiles(filePath));
      } else {
        results.push(filePath);
      }
    }
    return results;
  }

  const outputFiles = getAllFiles(outputDir);
  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});

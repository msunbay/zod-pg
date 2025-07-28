import fs from 'fs';
import path from 'path';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

export interface TestDbContext {
  container: StartedPostgreSqlContainer;
  client: Client;
}

let _clientInstance: Client | null = null;

export const getClient = (): Client => {
  if (!_clientInstance) {
    throw new Error('Client has not been initialized. Call setupTestDb first.');
  }
  return _clientInstance;
};

export const getClientConnectionString = (): string => {
  const client = getClient();
  return `postgres://${client.user}:${client.password}@${client.host}:${client.port}/${client.database}`;
};

export async function setupTestDb(): Promise<TestDbContext> {
  const schemaPath = path.resolve(__dirname, './schema.sql');

  const container = await new PostgreSqlContainer('postgres').start();

  const client = new Client({
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  });

  await client.connect();

  // Create schema
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await client.query(schemaSql);

  _clientInstance = client;

  return { container, client };
}

export async function teardownTestDb(ctx: TestDbContext) {
  await ctx.client.end();
  await ctx.container.stop();
}

export const outputDir = path.resolve(__dirname, './output/generated');

export function getOutputFiles(dir = outputDir): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of list) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      results = results.concat(getOutputFiles(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

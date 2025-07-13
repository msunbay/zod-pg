import path from 'path';

import { setupTestDb, teardownTestDb, TestDbContext } from './testDbUtils';

jest.setTimeout(60000);
jest.mock('../../src/utils/logger');

let db: TestDbContext;

beforeAll(async () => {
  db = await setupTestDb(path.resolve(__dirname, './schema.sql'));
});

afterAll(async () => {
  await teardownTestDb(db);
});

import { sql } from '../../../../src/utils/sql.js';
import {
  UserInsertRecord,
  UsersTableInsertSchema,
  UsersTableSchema,
} from '../../output/generated/tables/users.js';
import {
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

it('insert schema works', async () => {
  const createdAt = new Date('2023-10-01T00:00:00Z');

  const insertRecord: UserInsertRecord = {
    name: 'Test User',
    email: 'test@test.com',
    profile: { name: 'Test bio' },
    createdAt,
    roles: ['admin'],
    status: 'active',
    dates: [createdAt],
  };

  const parsedInsertRecord = UsersTableInsertSchema.parse(insertRecord);

  await ctx.client.query(sql`
    INSERT INTO users ( name, email, profile, created_at)
    VALUES ('${parsedInsertRecord.name}', '${parsedInsertRecord.email}', '${parsedInsertRecord.profile}', '${parsedInsertRecord.created_at?.toISOString()}')`);

  const result = await ctx.client.query(sql`
      SELECT * FROM users`);

  const userRecord = result.rows[0];

  const user = UsersTableSchema.parse(userRecord);

  expect(user).toEqual({
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    profile: { name: 'Test bio' },
    roles: undefined,
    status: 'active',
    dates: undefined,
    createdAt: createdAt,
  });
});

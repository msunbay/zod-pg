import { main } from './src/cli.js';
import {
  getClientConnectionString,
  setupTestDb,
  teardownTestDb,
} from './test/integration/testDbUtils.js';

const setup = async () => {
  const db = await setupTestDb();

  console.log('Test database setup complete.', {
    connectionString: getClientConnectionString(),
  });

  process.on('exit', async () => {
    await teardownTestDb(db);
    console.log('Test database connection closed and container stopped.');
  });

  await main(db.client.port);
  process.exit(0);
};

void setup();

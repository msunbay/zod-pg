import fs from 'fs';
import path from 'path';

import type { ZodPgProgress } from '../../../../src/types.js';

import { generateZodSchemas } from '../../../../src/generateZodSchemas.js';
import {
  deleteOutputFiles,
  getClientConnectionString,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;

const outputDir = `${import.meta.dirname}/test-output/progress`;
let connectionString: string;

beforeAll(async () => {
  ctx = await setupTestDb();
  connectionString = getClientConnectionString();
});

afterAll(async () => {
  await teardownTestDb(ctx);
  await deleteOutputFiles(outputDir);
});

describe('progress callback', () => {
  it('calls onProgress callback with correct status updates', async () => {
    const progressEvents: { status: ZodPgProgress; args?: unknown }[] = [];

    await generateZodSchemas({
      connection: {
        connectionString,
        ssl: false,
      },
      outputDir: `${outputDir}/progress-tracking`,
      include: ['users', 'posts'],
      onProgress: (status: ZodPgProgress, args?: unknown) => {
        progressEvents.push({ status, args });
      },
    });

    // Verify the expected progress sequence
    expect(progressEvents).toHaveLength(4);

    expect(progressEvents[0]).toEqual({
      status: 'connecting',
      args: undefined,
    });
    expect(progressEvents[1]).toEqual({
      status: 'fetchingSchema',
      args: undefined,
    });
    expect(progressEvents[2]).toEqual({
      status: 'generating',
      args: { total: 2 },
    });
    expect(progressEvents[3]).toEqual({ status: 'done', args: undefined });

    const outputFiles = await getOutputFiles(`${outputDir}/progress-tracking`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `progress-tracking/${path.relative(`${outputDir}/progress-tracking`, file)}`
      );
    }
  });

  it('works without onProgress callback', async () => {
    // Should not throw when no progress callback is provided
    await expect(
      generateZodSchemas({
        connection: {
          connectionString,
          ssl: false,
        },
        outputDir: `${outputDir}/no-progress`,
        include: ['users'],
        // No onProgress callback
      })
    ).resolves.toBeDefined();

    const outputFiles = await getOutputFiles(`${outputDir}/no-progress`);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(
        `no-progress/${path.relative(`${outputDir}/no-progress`, file)}`
      );
    }
  });
});

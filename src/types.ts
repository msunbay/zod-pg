import { ZodDbsCliConfig } from 'zod-dbs-cli';

import 'zod-dbs-pg';

export interface ZodPgConfig extends Omit<ZodDbsCliConfig, 'provider'> {}

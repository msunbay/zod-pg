import { ZodDbsCliConfig } from 'zod-dbs-cli';

export interface ZodPgConfig extends Omit<ZodDbsCliConfig, 'provider'> {}

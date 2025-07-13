import { blue, gray, magenta, white, yellow } from 'colorette';
import debug from 'debug';

export const logDebug = debug('zod-pg');

export const logSetting = (name: string, value: string) => {
  console.info(`- ${white(name)}: ${blue(value)}`);
};

export const logInfo = (message: string) => {
  console.debug(`${gray('ℹ️')} ${message}`);
};

export const logSuccess = (message: string) => {
  console.info(`✅ ${message}`);
};

export const logAppName = (message: string) => {
  console.info(magenta(`\n${message}\n`));
};

export const logError = (message: string) => {
  console.error(`❌ ${message}`);
};

export const logWarning = (message: string) => {
  console.warn(`${yellow('⚠️')} ${message}`);
};

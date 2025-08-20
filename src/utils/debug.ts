import debug from 'debug';

export const enableDebug = () => {
  process.env.DEBUG = 'zod-pg:*';
  debug.enable('zod-pg');
};

export const logDebug = (...args: any[]) => {
  debug('zod-pg')(args);
};

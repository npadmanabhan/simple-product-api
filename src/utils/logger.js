'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

const log = (severity, message, meta = {}) => {
  if (LEVELS[severity] > currentLevel) return;

  const entry = JSON.stringify({
    severity: severity.toUpperCase(),
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  });

  if (severity === 'error') {
    process.stderr.write(entry + '\n');
  } else {
    process.stdout.write(entry + '\n');
  }
};

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

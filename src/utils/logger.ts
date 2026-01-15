/**
 * Simple logger utility for Node.js server
 */

enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

const log = (level: LogLevel, message: string, data: unknown = null): void => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

export const logger = {
  error: (message: string, data?: unknown) => log(LogLevel.ERROR, message, data),
  warn: (message: string, data?: unknown) => log(LogLevel.WARN, message, data),
  info: (message: string, data?: unknown) => log(LogLevel.INFO, message, data),
  debug: (message: string, data?: unknown) => log(LogLevel.DEBUG, message, data)
};

export default logger;

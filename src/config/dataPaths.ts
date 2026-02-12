import path from 'path';

const projectRoot = process.cwd();
const isProduction = process.env.NODE_ENV === 'production';

export const USERS_FILE_PATH = isProduction
  ? path.join(projectRoot, 'data', 'users.json')
  : path.join(projectRoot, 'src', 'data', 'users.json');

export const AUTH_LOG_PATH = isProduction
  ? path.join(projectRoot, 'logs', 'logs-auth.json')
  : path.join(projectRoot, 'src', 'logs-auth.json');

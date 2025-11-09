const dotenv = require('dotenv');

dotenv.config();

const {
  API_PORT,
  APP_PORT,
  SERVER_PORT,
  PORT,
  DATABASE_URL,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  JWT_SECRET,
  JWT_EXPIRATION
} = process.env;

const needsSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

let databaseUrl = DATABASE_URL;
if (databaseUrl && needsSsl && !/sslmode=/i.test(databaseUrl)) {
  databaseUrl += databaseUrl.includes('?') ? '&sslmode=require' : '?sslmode=require';
}
if (!databaseUrl && DB_HOST && DB_NAME && DB_USER && DB_PASSWORD) {
  const resolvedDbPort = DB_PORT || 5432;
  const sslParam = needsSsl ? '?sslmode=require' : '';
  databaseUrl = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${resolvedDbPort}/${DB_NAME}${sslParam}`;
  process.env.DATABASE_URL = databaseUrl;
}

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DB_* variables must be provided in .env');
}

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in .env');
}

const env = {
  port: Number(API_PORT || APP_PORT || SERVER_PORT || PORT || 4000),
  databaseUrl,
  jwtSecret: JWT_SECRET,
  jwtExpiration: JWT_EXPIRATION || '1d'
};

module.exports = { env };

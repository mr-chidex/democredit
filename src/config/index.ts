import 'dotenv/config';

const config = {
  API_VERSION: process.env.API_VERSION!,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV!,
  DB_USERNAME: process.env.DB_USERNAME!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  DB_NAME: process.env.DB_NAME!,
  SECRET_KEY: process.env.SECRET_KEY!,
};

export default config;

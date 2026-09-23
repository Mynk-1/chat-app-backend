require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const defaultOrigins = 'https://chat-app-1zlj.onrender.com,http://localhost:3000';

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  port: process.env.PORT || 5000,
  isProd,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigins: (process.env.CLIENT_ORIGIN || defaultOrigins).split(',').map((s) => s.trim()),
  cookieName: 'token',
  cookieMaxAgeMs: (Number(process.env.COOKIE_MAX_AGE_DAYS) || 7) * 24 * 60 * 60 * 1000,
};

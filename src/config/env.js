require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const defaultOrigins = 'https://store.teststore.fun';

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
  // Dev-only stand-in for a real SMS OTP provider — no SMS is actually sent,
  // every phone number accepts this fixed code. Swap for a real provider
  // integration before shipping to real users.
  otpStaticCode: process.env.OTP_STATIC_CODE || '123456',
};

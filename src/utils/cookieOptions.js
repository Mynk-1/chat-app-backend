const { isProd, cookieMaxAgeMs } = require('../config/env');

// Cross-site cookies (frontend and backend live on different hostnames) need
// SameSite=None + Secure, but Secure cookies are silently dropped by browsers
// over plain http, which is what local dev uses — hence the isProd branch.
const authCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
});

const loginCookieOptions = () => ({
  ...authCookieOptions(),
  maxAge: cookieMaxAgeMs,
});

module.exports = { authCookieOptions, loginCookieOptions };

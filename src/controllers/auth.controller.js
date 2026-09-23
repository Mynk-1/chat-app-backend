const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authService = require('../services/auth.service');
const { cookieName } = require('../config/env');
const { loginCookieOptions, authCookieOptions } = require('../utils/cookieOptions');

const loginOrRegister = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    throw new ApiError(400, 'Phone number is required');
  }

  const { user, token, isNewUser } = await authService.loginOrRegister(phoneNumber);

  // The token is only ever set as an httpOnly cookie — it's never put in the
  // response body, so client-side JS (and any XSS payload) has no access to it.
  res.cookie(cookieName, token, loginCookieOptions());

  res.json({
    success: true,
    message: isNewUser ? 'Registered successfully' : 'Logged in successfully',
    user,
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie(cookieName, authCookieOptions());
  res.json({ success: true, message: 'Logged out successfully' });
});

// Called on page refresh to turn the httpOnly cookie back into a user session.
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { loginOrRegister, logout, getMe };

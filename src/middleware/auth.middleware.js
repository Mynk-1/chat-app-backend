const { verifyToken } = require('../utils/jwt');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { cookieName } = require('../config/env');

const authenticate = asyncHandler(async (req, res, next) => {
  // The browser client authenticates via the httpOnly cookie set on login.
  // The Authorization header is kept as a fallback for non-browser clients
  // (curl, future mobile apps, tests) that can't rely on cookies.
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];
  const token = bearerToken || req.cookies?.[cookieName];

  if (!token) {
    throw new ApiError(401, 'Unauthorized: No token provided');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw new ApiError(401, 'Unauthorized: Invalid token');
  }

  // The authenticated identity always comes from the verified token, never
  // from the request body — callers must not be able to act as another user
  // by passing a different phoneNumber/ownerNumber in the payload.
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Unauthorized: User not found');
  }

  req.user = user;
  next();
});

module.exports = authenticate;

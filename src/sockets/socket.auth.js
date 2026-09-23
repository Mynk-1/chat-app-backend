const cookie = require('cookie');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/user.model');
const { cookieName } = require('../config/env');

// Runs once per connection attempt (io.use). The JWT lives in an httpOnly
// cookie, so client JS can't read it to pass explicitly — instead the cookie
// rides along automatically on the socket.io handshake request (the client
// must connect with { withCredentials: true }), and we parse it out of the
// raw Cookie header here. socket.handshake.auth.token is kept as a fallback
// for non-browser clients.
const socketAuth = async (socket, next) => {
  try {
    const rawCookieHeader = socket.handshake.headers.cookie;
    const parsedCookies = rawCookieHeader ? cookie.parse(rawCookieHeader) : {};
    const token = socket.handshake.auth?.token || parsedCookies[cookieName];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = { id: user._id.toString(), phoneNumber: user.phoneNumber };
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

module.exports = socketAuth;

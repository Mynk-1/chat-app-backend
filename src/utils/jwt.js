const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, phoneNumber: user.phoneNumber },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
};

const verifyToken = (token) => jwt.verify(token, jwtSecret);

module.exports = { generateToken, verifyToken };

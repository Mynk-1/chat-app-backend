const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');
const { otpStaticCode } = require('../config/env');
const ApiError = require('../utils/ApiError');

const loginOrRegister = async (phoneNumber) => {
  let user = await User.findOne({ phoneNumber });
  let isNewUser = false;

  if (!user) {
    user = await User.create({ phoneNumber });
    isNewUser = true;
  }

  const token = generateToken(user);
  return { user, token, isNewUser };
};

// Dev-mode OTP: no SMS provider wired up, so there's nothing to actually
// "send" — this just validates the shape of the request. Swap this for a
// real provider call before shipping to real users.
const sendOtp = async (phoneNumber) => {
  if (!/^\d{10}$/.test(phoneNumber)) {
    throw new ApiError(400, 'A valid 10-digit phone number is required');
  }
};

const verifyOtp = async (phoneNumber, otp) => {
  if (otp !== otpStaticCode) {
    throw new ApiError(401, 'Invalid OTP');
  }
  return loginOrRegister(phoneNumber);
};

module.exports = { loginOrRegister, sendOtp, verifyOtp };

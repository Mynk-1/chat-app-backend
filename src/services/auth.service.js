const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');

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

module.exports = { loginOrRegister };

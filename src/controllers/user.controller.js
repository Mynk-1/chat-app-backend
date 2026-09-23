const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');

// Powers the WhatsApp-style "search a number, see if they're on the app"
// flow — no contact relationship required to look someone up.
const lookupUser = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.params;

  const user = await User.findOne({ phoneNumber }).lean();
  if (!user) {
    throw new ApiError(404, 'No user found with this number');
  }

  res.json({ success: true, user: { phoneNumber: user.phoneNumber } });
});

module.exports = { lookupUser };

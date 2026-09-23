const asyncHandler = require('../utils/asyncHandler');
const callService = require('../services/call.service');

const getCallHistory = asyncHandler(async (req, res) => {
  const calls = await callService.getCallHistory(req.user.phoneNumber);
  res.json({ success: true, calls });
});

module.exports = { getCallHistory };

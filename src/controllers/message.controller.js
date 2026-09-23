const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const messageService = require('../services/message.service');

const sendMessage = asyncHandler(async (req, res) => {
  const { recipient, content } = req.body;
  if (!recipient || !content) {
    throw new ApiError(400, 'recipient and content are required');
  }

  const message = await messageService.sendMessage({
    io: req.io,
    sender: req.user.phoneNumber,
    recipient,
    content,
  });

  res.status(201).json({ success: true, message });
});

const getMessages = asyncHandler(async (req, res) => {
  const { contactNumber } = req.params;
  const { before, limit } = req.query;

  const messages = await messageService.getMessages(req.user.phoneNumber, contactNumber, {
    before,
    limit: limit ? Number(limit) : undefined,
  });

  res.json({ success: true, messages });
});

const markRead = asyncHandler(async (req, res) => {
  const { contactNumber } = req.params;
  await messageService.markRead(req.user.phoneNumber, contactNumber);
  res.json({ success: true });
});

module.exports = { sendMessage, getMessages, markRead };

const asyncHandler = require('../utils/asyncHandler');
const chatService = require('../services/chat.service');

const getChats = asyncHandler(async (req, res) => {
  const chats = await chatService.getUnifiedChatList(req.user.phoneNumber);
  res.json({ success: true, chats });
});

module.exports = { getChats };

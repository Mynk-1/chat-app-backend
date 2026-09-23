const asyncHandler = require('../utils/asyncHandler');
const contactService = require('../services/contact.service');
const chatService = require('../services/chat.service');

const updateContactProfile = asyncHandler(async (req, res) => {
  const { contactNumber } = req.params;
  const { nickname, avatarColor } = req.body;

  await contactService.updateContactProfile(req.user.phoneNumber, contactNumber, {
    nickname,
    avatarColor,
  });
  const chats = await chatService.getUnifiedChatList(req.user.phoneNumber);

  res.json({ success: true, chats });
});

module.exports = { updateContactProfile };

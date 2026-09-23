const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const groupService = require('../services/group.service');
const chatService = require('../services/chat.service');
const presenceService = require('../services/presence.service');
const events = require('../constants/events');

const createGroup = asyncHandler(async (req, res) => {
  const { name, members } = req.body;
  if (!name || !Array.isArray(members) || members.length === 0) {
    throw new ApiError(400, 'A group name and at least one member are required');
  }

  const group = await groupService.createGroup({
    name: name.trim(),
    members,
    createdBy: req.user.phoneNumber,
  });

  // Let every member's other open tabs/devices know a new group exists.
  if (req.io) {
    await Promise.all(
      group.members.map(async (member) => {
        const chats = await chatService.getUnifiedChatList(member);
        presenceService.getSocketIds(member).forEach((socketId) => {
          req.io.to(socketId).emit(events.CHATS_UPDATED, chats);
        });
      })
    );
  }

  res.status(201).json({ success: true, group });
});

module.exports = { createGroup };

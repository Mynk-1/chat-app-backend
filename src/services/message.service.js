const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const contactService = require('./contact.service');
const groupService = require('./group.service');
const chatService = require('./chat.service');
const presenceService = require('./presence.service');
const activeChatService = require('./activeChat.service');
const ApiError = require('../utils/ApiError');
const events = require('../constants/events');

const buildConversationId = (a, b) => [a, b].sort().join('_');

const ensureConversation = async (participant1, participant2) => {
  const conversationId = buildConversationId(participant1, participant2);
  await Conversation.findOneAndUpdate(
    { conversationId },
    { $setOnInsert: { conversationId, participants: [participant1, participant2] } },
    { upsert: true }
  );
  return conversationId;
};

const emitToUser = (io, phoneNumber, event, payload) => {
  presenceService.getSocketIds(phoneNumber).forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
};

const emitUnifiedChats = async (io, phoneNumber) => {
  const chats = await chatService.getUnifiedChatList(phoneNumber);
  emitToUser(io, phoneNumber, events.CHATS_UPDATED, chats);
};

// Single source of truth for "send a 1:1 message" — called from both the
// socket handler and the REST controller (via req.io) so the business logic
// never has to be duplicated between transports.
const sendMessage = async ({ io, sender, recipient, content }) => {
  // The first message between two numbers is what creates the contact
  // relationship on both sides — there's no separate "add contact" step.
  await Promise.all([
    contactService.ensureContactRelation(sender, recipient),
    contactService.ensureContactRelation(recipient, sender),
  ]);

  const conversationId = await ensureConversation(sender, recipient);

  // If the recipient already has this exact conversation open, the message
  // arrives "seen" immediately (matches WhatsApp) and must not bump their
  // unread badge for a chat they're already looking at.
  const recipientIsViewing = activeChatService.isViewing(recipient, sender);

  const message = await Message.create({
    conversationId,
    sender,
    recipient,
    content,
    read: recipientIsViewing,
    timestamp: new Date(),
  });

  await Promise.all([
    contactService.updateContactPreview({
      ownerNumber: sender,
      otherNumber: recipient,
      lastMessage: content,
      lastMessageTime: message.timestamp,
      incrementUnread: false,
    }),
    contactService.updateContactPreview({
      ownerNumber: recipient,
      otherNumber: sender,
      lastMessage: content,
      lastMessageTime: message.timestamp,
      incrementUnread: !recipientIsViewing,
    }),
  ]);

  if (io) {
    emitToUser(io, sender, events.MESSAGE_NEW, message);
    emitToUser(io, recipient, events.MESSAGE_NEW, message);
    await Promise.all([emitUnifiedChats(io, sender), emitUnifiedChats(io, recipient)]);
  }

  return message;
};

// Group counterpart of sendMessage — same shape, fanned out to every member.
const sendGroupMessage = async ({ io, sender, groupId, content }) => {
  const group = await groupService.getGroup(groupId);
  if (!group || !group.members.includes(sender)) {
    throw new ApiError(404, 'Group not found');
  }

  const message = await Message.create({
    conversationId: groupId,
    sender,
    groupId,
    content,
    read: true, // no per-member read receipts for groups in this pass
    timestamp: new Date(),
  });

  const otherMembers = group.members.filter((m) => m !== sender);

  await Promise.all([
    groupService.updateGroupPreview({
      ownerNumber: sender,
      groupId,
      lastMessage: content,
      lastMessageTime: message.timestamp,
      incrementUnread: false,
    }),
    ...otherMembers.map((member) =>
      groupService.updateGroupPreview({
        ownerNumber: member,
        groupId,
        lastMessage: content,
        lastMessageTime: message.timestamp,
        incrementUnread: !activeChatService.isViewing(member, groupId),
      })
    ),
  ]);

  if (io) {
    group.members.forEach((member) => emitToUser(io, member, events.MESSAGE_NEW, message));
    await Promise.all(group.members.map((member) => emitUnifiedChats(io, member)));
  }

  return message;
};

const getMessages = async (participant1, participant2, { before, limit = 30 } = {}) => {
  const conversationId = buildConversationId(participant1, participant2);
  const query = { conversationId };
  if (before) {
    query.timestamp = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return messages.reverse(); // oldest -> newest for rendering
};

const getGroupMessages = async (groupId, { before, limit = 30 } = {}) => {
  const query = { conversationId: groupId };
  if (before) {
    query.timestamp = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return messages.reverse();
};

const markRead = async (ownerNumber, otherNumber) => {
  const conversationId = buildConversationId(ownerNumber, otherNumber);
  await Message.updateMany(
    { conversationId, sender: otherNumber, recipient: ownerNumber, read: false },
    { $set: { read: true } }
  );
  await contactService.markConversationRead(ownerNumber, otherNumber);
};

module.exports = {
  sendMessage,
  sendGroupMessage,
  getMessages,
  getGroupMessages,
  markRead,
  buildConversationId,
};

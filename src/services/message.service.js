const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const contactService = require('./contact.service');
const presenceService = require('./presence.service');
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

// Single source of truth for "send a message" — called from both the socket
// handler and the REST controller (via req.io) so the business logic never
// has to be duplicated between transports.
const sendMessage = async ({ io, sender, recipient, content }) => {
  const conversationId = await ensureConversation(sender, recipient);

  const message = await Message.create({
    conversationId,
    sender,
    recipient,
    content,
    timestamp: new Date(),
  });

  // This is what actually makes "order by last message" and unread badges
  // work — the old code set these fields once when a contact was added and
  // then never touched them again on send.
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
      incrementUnread: true,
    }),
  ]);

  if (io) {
    emitToUser(io, sender, events.MESSAGE_NEW, message);
    emitToUser(io, recipient, events.MESSAGE_NEW, message);

    const [senderContacts, recipientContacts] = await Promise.all([
      contactService.getContactList(sender),
      contactService.getContactList(recipient),
    ]);
    emitToUser(io, sender, events.CONTACT_UPDATED, senderContacts);
    emitToUser(io, recipient, events.CONTACT_UPDATED, recipientContacts);
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

const markRead = async (ownerNumber, otherNumber) => {
  const conversationId = buildConversationId(ownerNumber, otherNumber);
  await Message.updateMany(
    { conversationId, sender: otherNumber, recipient: ownerNumber, read: false },
    { $set: { read: true } }
  );
  await contactService.markConversationRead(ownerNumber, otherNumber);
};

module.exports = { sendMessage, getMessages, markRead, buildConversationId };

const messageService = require('../../services/message.service');
const groupService = require('../../services/group.service');
const chatService = require('../../services/chat.service');
const activeChatService = require('../../services/activeChat.service');
const events = require('../../constants/events');

const registerMessageHandlers = (io, socket) => {
  const me = socket.user.phoneNumber;

  socket.on(events.MESSAGE_SEND, async ({ recipient, groupId, content }) => {
    try {
      if (!content || !content.trim()) return;

      if (groupId) {
        await messageService.sendGroupMessage({ io, sender: me, groupId, content: content.trim() });
      } else if (recipient) {
        await messageService.sendMessage({ io, sender: me, recipient, content: content.trim() });
      }
    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Emitted by the client when a chat thread (1:1 or group) is opened —
  // marks it as the chat this user is actively viewing (so a message that
  // arrives right now doesn't bump their unread badge) and clears unread
  // state for real.
  socket.on(events.CHAT_OPEN, async ({ contactNumber, groupId }) => {
    try {
      const chatKey = groupId || contactNumber;
      if (!chatKey) return;

      activeChatService.setActive(me, chatKey);

      if (groupId) {
        await groupService.markGroupRead(me, groupId);
      } else {
        await messageService.markRead(me, contactNumber);
      }

      const chats = await chatService.getUnifiedChatList(me);
      socket.emit(events.CHATS_UPDATED, chats);
    } catch (error) {
      console.error('Error marking chat read:', error);
    }
  });

  // Emitted when the client leaves a chat (deselects it / navigates away)
  // so it stops being treated as "actively viewing" for unread purposes.
  socket.on(events.CHAT_CLOSE, () => {
    activeChatService.clearActive(me);
  });
};

module.exports = registerMessageHandlers;

const messageService = require('../../services/message.service');
const contactService = require('../../services/contact.service');
const events = require('../../constants/events');

const registerMessageHandlers = (io, socket) => {
  socket.on(events.MESSAGE_SEND, async ({ recipient, content }) => {
    try {
      if (!recipient || !content || !content.trim()) return;
      await messageService.sendMessage({
        io,
        sender: socket.user.phoneNumber,
        recipient,
        content: content.trim(),
      });
    } catch (error) {
      console.error('Error sending message via socket:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Emitted by the client when a chat thread is opened — clears unread state
  // for real (marks the underlying messages read, not just the counter).
  socket.on(events.CHAT_OPEN, async ({ contactNumber }) => {
    try {
      if (!contactNumber) return;
      await messageService.markRead(socket.user.phoneNumber, contactNumber);

      const contacts = await contactService.getContactList(socket.user.phoneNumber);
      socket.emit(events.CONTACT_UPDATED, contacts);
    } catch (error) {
      console.error('Error marking chat read:', error);
    }
  });
};

module.exports = registerMessageHandlers;

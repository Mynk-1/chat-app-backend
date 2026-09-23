const presenceService = require('../../services/presence.service');
const events = require('../../constants/events');

// Pure relay, no persistence — "typing" is ephemeral UI state, not data
// worth storing. Same shape as message.handler.js's emitToUser pattern.
const registerTypingHandlers = (io, socket) => {
  const relay = (isTyping) => ({ recipient }) => {
    if (!recipient) return;
    presenceService.getSocketIds(recipient).forEach((socketId) => {
      io.to(socketId).emit(events.TYPING_UPDATE, { from: socket.user.phoneNumber, isTyping });
    });
  };

  socket.on(events.TYPING_START, relay(true));
  socket.on(events.TYPING_STOP, relay(false));
};

module.exports = registerTypingHandlers;

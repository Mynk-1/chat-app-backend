const socketAuth = require('./socket.auth');
const registerPresenceHandlers = require('./handlers/presence.handler');
const registerMessageHandlers = require('./handlers/message.handler');
const registerTypingHandlers = require('./handlers/typing.handler');
const registerCallHandlers = require('./handlers/call.handler');

const registerSocketHandlers = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (${socket.user.phoneNumber})`);

    registerPresenceHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerCallHandlers(io, socket);
  });
};

module.exports = registerSocketHandlers;

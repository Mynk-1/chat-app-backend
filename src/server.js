const http = require('http');
const socketIo = require('socket.io');
const createApp = require('./app');
const connectDB = require('./config/db');
const registerSocketHandlers = require('./sockets');
const { port, clientOrigins } = require('./config/env');

const start = async () => {
  await connectDB();

  // io needs the bare server, and the express app needs io (for req.io) —
  // so the server is created first with no request listener, and the app
  // is attached to it once it exists.
  const server = http.createServer();
  const io = socketIo(server, { cors: { origin: clientOrigins, credentials: true } });

  const app = createApp(io);
  server.on('request', app);

  registerSocketHandlers(io);

  server.listen(port, () => console.log(`Server running on port ${port}`));
};

start();

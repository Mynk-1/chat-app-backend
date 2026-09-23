// Makes the socket.io instance available to HTTP controllers as req.io, so
// REST endpoints (e.g. sending a message over plain HTTP) can emit realtime
// events through the same code path sockets use.
const attachIo = (io) => (req, res, next) => {
  req.io = io;
  next();
};

module.exports = attachIo;

// In-memory online-presence tracker: phoneNumber -> set of active socket ids
// (supports multiple tabs/devices per user, unlike the old single socketId
// field on the User document, which one tab would silently clobber).
//
// This only works correctly for a single server process. If this app ever
// needs to run multiple instances, swap the Map below for a Redis-backed
// store (e.g. Redis sets keyed by phone number) — every function below is
// the whole interface the rest of the app depends on, so callers don't
// change.
const onlineUsers = new Map();

const addSocket = (phoneNumber, socketId) => {
  if (!onlineUsers.has(phoneNumber)) {
    onlineUsers.set(phoneNumber, new Set());
  }
  onlineUsers.get(phoneNumber).add(socketId);
};

const removeSocket = (phoneNumber, socketId) => {
  const sockets = onlineUsers.get(phoneNumber);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(phoneNumber);
  }
};

const isOnline = (phoneNumber) => onlineUsers.has(phoneNumber);

const getSocketIds = (phoneNumber) => Array.from(onlineUsers.get(phoneNumber) || []);

module.exports = { addSocket, removeSocket, isOnline, getSocketIds };

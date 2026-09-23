// In-memory "what chat is this user looking at right now" tracker — same
// single-process pattern/caveat as presence.service.js. The key is either a
// contact's phone number or a group's id; no collision risk (10-digit
// numbers vs 24-char ObjectId strings).
const activeChatByUser = new Map();

const setActive = (phoneNumber, chatKey) => {
  activeChatByUser.set(phoneNumber, chatKey);
};

const clearActive = (phoneNumber) => {
  activeChatByUser.delete(phoneNumber);
};

// Is `phoneNumber` currently looking at the chat identified by `chatKey`?
const isViewing = (phoneNumber, chatKey) => activeChatByUser.get(phoneNumber) === chatKey;

module.exports = { setActive, clearActive, isViewing };

const User = require('../../models/user.model');
const presenceService = require('../../services/presence.service');
const contactService = require('../../services/contact.service');
const activeChatService = require('../../services/activeChat.service');
const events = require('../../constants/events');

// Tracks a single connected socket's presence and lets that user's contacts
// know when they come online / go offline (with a lastSeen timestamp).
const registerPresenceHandlers = (io, socket) => {
  const { phoneNumber } = socket.user;

  presenceService.addSocket(phoneNumber, socket.id);

  const broadcastPresence = async (online) => {
    const owners = await contactService.getOwnersWhoHaveContact(phoneNumber);
    owners.forEach((ownerNumber) => {
      presenceService.getSocketIds(ownerNumber).forEach((socketId) => {
        io.to(socketId).emit(events.PRESENCE_CHANGED, { contactNumber: phoneNumber, online });
      });
    });
  };

  broadcastPresence(true).catch((error) => console.error('Error broadcasting presence:', error));

  socket.on('disconnect', async () => {
    presenceService.removeSocket(phoneNumber, socket.id);

    // Only announce "offline" once every tab/device for this user has gone.
    if (!presenceService.isOnline(phoneNumber)) {
      activeChatService.clearActive(phoneNumber);
      try {
        await User.updateOne({ phoneNumber }, { lastSeen: new Date() });
        await broadcastPresence(false);
      } catch (error) {
        console.error('Error handling disconnect presence update:', error);
      }
    }
  });
};

module.exports = registerPresenceHandlers;

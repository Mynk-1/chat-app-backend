const contactService = require('../../services/contact.service');
const presenceService = require('../../services/presence.service');
const events = require('../../constants/events');

const registerContactHandlers = (io, socket) => {
  socket.on(events.CONTACT_ADD, async ({ contactNumber }) => {
    try {
      if (!contactNumber) {
        return socket.emit(events.CONTACT_ADD_RESULT, {
          status: 'error',
          message: 'contactNumber is required',
        });
      }

      const ownerNumber = socket.user.phoneNumber;
      await contactService.addContact(ownerNumber, contactNumber);

      socket.emit(events.CONTACT_ADD_RESULT, {
        status: 'success',
        message: 'Contact added successfully',
      });

      const ownerContacts = await contactService.getContactList(ownerNumber);
      socket.emit(events.CONTACT_UPDATED, ownerContacts);

      const contactSocketIds = presenceService.getSocketIds(contactNumber);
      if (contactSocketIds.length > 0) {
        const contactContacts = await contactService.getContactList(contactNumber);
        contactSocketIds.forEach((socketId) => {
          io.to(socketId).emit(events.CONTACT_UPDATED, contactContacts);
        });
      }
    } catch (error) {
      socket.emit(events.CONTACT_ADD_RESULT, {
        status: 'error',
        message: error.message || 'Failed to add contact',
      });
    }
  });
};

module.exports = registerContactHandlers;

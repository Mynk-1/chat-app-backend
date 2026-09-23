const ContactList = require('../models/contactList.model');
const User = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const presenceService = require('./presence.service');
const AVATAR_COLORS = require('../constants/avatarColors');

// Owners who have `contactNumber` somewhere in their contact list — used to
// know who to notify when that number's online status changes.
const getOwnersWhoHaveContact = async (contactNumber) => {
  const lists = await ContactList.find(
    { 'contacts.contactNumber': contactNumber },
    { ownerNumber: 1 }
  );
  return lists.map((list) => list.ownerNumber);
};

const getContactList = async (ownerNumber) => {
  const contactList = await ContactList.findOne({ ownerNumber }).lean();
  if (!contactList) return [];

  // Real sort by most-recent message, replacing the old code's reliance on
  // array insertion order + .reverse(), which only ever worked by accident
  // and broke as soon as an existing contact's preview needed to move.
  return [...contactList.contacts]
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))
    .map((contact) => ({
      ...contact,
      online: presenceService.isOnline(contact.contactNumber),
    }));
};

// Adds `otherNum` to `ownerNum`'s contact list if not already present.
// Two-step (ensure the list document exists, then push) so a concurrent
// upsert can never collide with the unique index on ownerNumber.
const addSide = async (ownerNum, otherNum) => {
  await ContactList.findOneAndUpdate(
    { ownerNumber: ownerNum },
    { $setOnInsert: { ownerNumber: ownerNum, contacts: [] } },
    { upsert: true }
  );

  const result = await ContactList.updateOne(
    { ownerNumber: ownerNum, 'contacts.contactNumber': { $ne: otherNum } },
    {
      $push: {
        contacts: {
          contactNumber: otherNum,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadMessageCount: 0,
        },
      },
    }
  );

  return result.modifiedCount > 0;
};

const addContact = async (ownerNumber, contactNumber) => {
  if (ownerNumber === contactNumber) {
    throw new ApiError(400, 'You cannot add yourself as a contact');
  }

  const [owner, contactUser] = await Promise.all([
    User.findOne({ phoneNumber: ownerNumber }),
    User.findOne({ phoneNumber: contactNumber }),
  ]);

  if (!owner || !contactUser) {
    throw new ApiError(404, 'User not found');
  }

  const [ownerSideAdded, contactSideAdded] = await Promise.all([
    addSide(ownerNumber, contactNumber),
    addSide(contactNumber, ownerNumber),
  ]);

  if (!ownerSideAdded && !contactSideAdded) {
    throw new ApiError(400, 'Contact already exists');
  }

  return { ownerNumber, contactNumber };
};

// Atomic preview update — replaces the old find-mutate-save pattern, which
// could lose updates when two messages landed on the same contact list at
// nearly the same time.
const updateContactPreview = async ({ ownerNumber, otherNumber, lastMessage, lastMessageTime, incrementUnread }) => {
  const update = {
    $set: {
      'contacts.$.lastMessage': lastMessage,
      'contacts.$.lastMessageTime': lastMessageTime,
    },
  };
  if (incrementUnread) {
    update.$inc = { 'contacts.$.unreadMessageCount': 1 };
  }

  await ContactList.updateOne({ ownerNumber, 'contacts.contactNumber': otherNumber }, update);
};

const markConversationRead = async (ownerNumber, otherNumber) => {
  await ContactList.updateOne(
    { ownerNumber, 'contacts.contactNumber': otherNumber },
    { $set: { 'contacts.$.unreadMessageCount': 0 } }
  );
};

// Personal nickname/avatar for a contact — like the WhatsApp "contact info"
// screen. Owner-only: it never affects what the other participant sees.
const updateContactProfile = async (ownerNumber, contactNumber, { nickname, avatarColor }) => {
  const set = {};

  if (nickname !== undefined) {
    set['contacts.$.nickname'] = nickname.trim().slice(0, 60);
  }

  if (avatarColor !== undefined) {
    if (avatarColor !== '' && !AVATAR_COLORS.includes(avatarColor)) {
      throw new ApiError(400, 'Invalid avatar color');
    }
    set['contacts.$.avatarColor'] = avatarColor;
  }

  if (Object.keys(set).length === 0) {
    throw new ApiError(400, 'Nothing to update');
  }

  const result = await ContactList.updateOne(
    { ownerNumber, 'contacts.contactNumber': contactNumber },
    { $set: set }
  );

  if (result.matchedCount === 0) {
    throw new ApiError(404, 'Contact not found');
  }
};

module.exports = {
  getOwnersWhoHaveContact,
  getContactList,
  addContact,
  updateContactPreview,
  markConversationRead,
  updateContactProfile,
};

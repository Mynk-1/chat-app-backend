const mongoose = require('mongoose');

// Embedded per-relationship preview. Kept as a subdocument array (one doc per
// owner) rather than a top-level collection: a contact list realistically
// stays in the hundreds/low-thousands of entries, well within the 16MB
// document cap, so this doesn't have the same scaling problem messages did.
const contactSchema = new mongoose.Schema({
  contactNumber: { type: String, required: true },
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now },
  unreadMessageCount: { type: Number, default: 0 },
  // Personal, owner-only labeling of this contact — like saving a name/photo
  // for a number in your phone's contact book. Never visible to the other side.
  nickname: { type: String, default: '' },
  avatarColor: { type: String, default: '' },
});

const contactListSchema = new mongoose.Schema({
  ownerNumber: { type: String, required: true, unique: true },
  contacts: [contactSchema],
});

module.exports = mongoose.model('ContactList', contactListSchema);

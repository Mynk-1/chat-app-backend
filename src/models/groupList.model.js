const mongoose = require('mongoose');

// Per-owner group preview — mirrors contactList.model.js exactly, same
// reasoning: small, one doc per owner, no scale concern.
const groupPreviewSchema = new mongoose.Schema({
  groupId: { type: String, required: true },
  name: { type: String, required: true },
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now },
  unreadMessageCount: { type: Number, default: 0 },
});

const groupListSchema = new mongoose.Schema({
  ownerNumber: { type: String, required: true, unique: true },
  groups: [groupPreviewSchema],
});

module.exports = mongoose.model('GroupList', groupListSchema);

const mongoose = require('mongoose');

// Lightweight pointer document only — messages live in their own collection
// (see message.model.js) so this never grows unbounded.
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [String],
      validate: [(arr) => arr.length === 2, 'Two participants are required'],
      required: true,
    },
    conversationId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);

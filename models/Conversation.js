const mongoose = require('mongoose');
const messageSchema = require('../models/Message'); // Import the Message schema

// Define the Conversation schema
const conversationSchema = new mongoose.Schema({
  participants: {
    type: [String], // Array of phone numbers of the two participants, stored as numbers
    validate: [array => array.length === 2, 'Two participants are required'],
    required: true
  },
  conversationId: { type: String, required: true, unique: true }, // Unique identifier for conversation
  messages: [messageSchema] // Array of messages
});

// Middleware to create a unique conversationId based on sorted participants
conversationSchema.pre('validate', function(next) {
  if (this.participants.length === 2) {
    // Sort numbers to ensure consistency
    const sortedNumbers = this.participants.sort((a, b) => a - b);
    this.conversationId = `${sortedNumbers[0]}_${sortedNumbers[1]}`;
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);

const mongoose = require('mongoose');

// Define the Message schema
const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Phone number of the sender, stored as a number
  content: { type: String, required: true }, // Message content
  timestamp: { type: Date, default: Date.now }, // Message timestamp
  read: { type: Boolean, default: false } // Read status
});

module.exports = messageSchema;

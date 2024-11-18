const mongoose = require('mongoose');

// Define the Contact schema
const contactSchema = new mongoose.Schema({
    contactNumber: { type: String, required: true }, // Contact's phone number as a Number
    lastMessage: { type: String, default: '' }, // Last message as a string
    lastMessageTime: { type: Date, default: Date.now }, // Timestamp of the last message
    unreadMessageCount: { type: Number, default: 0 } // Count of unread messages
});

// Create the Contact model
const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;

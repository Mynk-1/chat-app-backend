const mongoose = require('mongoose');
const Contact = require('./Contact'); // Import the Contact model

// Define the ContactList schema
const contactListSchema = new mongoose.Schema({
  ownerNumber: { type: String, required: true, unique: true }, // Owner's phone number as a Number
  contacts: [Contact.schema] // Use the Contact schema for the contacts array
});

// Create the ContactList model
const ContactList = mongoose.model('ContactList', contactListSchema);

module.exports = ContactList;

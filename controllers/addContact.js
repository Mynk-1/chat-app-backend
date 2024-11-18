const User = require('../models/User'); // Import the User model
const ContactList = require('../models/ContactList'); // Import the ContactList model

// Function to find a user by phone number and add them to the contact list
// Function to find a user by phone number and add them to the contact list
exports.addContactByPhoneNumber = async (req, res) => {
  const { ownerNumber = req.user.phoneNumber, contactNumber } = req.body; // Expecting both ownerNumber and contactNumber in the request body

  try {
    // Find the user by contactNumber
    const user = await User.findOne({ phoneNumber: contactNumber });
    const owner = await User.findOne({ phoneNumber: ownerNumber });

    if (!user || !owner) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the owner's contact list exists
    let ownerContactList = await ContactList.findOne({ ownerNumber });
    if (!ownerContactList) {
      // Create a new contact list if it doesn't exist for the owner
      ownerContactList = new ContactList({ ownerNumber, contacts: [] });
    }

    // Check if the contact already exists in the owner's contact list
    const existingOwnerContact = ownerContactList.contacts.find(contact => contact.contactNumber === contactNumber);
    if (existingOwnerContact) {
      return res.status(400).json({ message: 'Contact already exists in the contact list' });
    }

    // Add contact to the owner's contact list
    const newContactForOwner = {
      contactNumber: user.phoneNumber,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadMessageCount: 0
    };
    ownerContactList.contacts.push(newContactForOwner);
    await ownerContactList.save();

    // Check if the contact's contact list exists
    let contactUserContactList = await ContactList.findOne({ ownerNumber: contactNumber });
    if (!contactUserContactList) {
      // Create a new contact list if it doesn't exist for the contact user
      contactUserContactList = new ContactList({ ownerNumber: contactNumber, contacts: [] });
    }

    // Check if the owner already exists in the contact user's contact list
    const existingContactUserContact = contactUserContactList.contacts.find(contact => contact.contactNumber === ownerNumber);
    if (existingContactUserContact) {
      return res.status(400).json({ message: 'Owner already exists in the contact user\'s contact list' });
    }

    // Add owner to the contact user's contact list
    const newContactForContactUser = {
      contactNumber: owner.phoneNumber,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadMessageCount: 0
    };
    contactUserContactList.contacts.push(newContactForContactUser);
    await contactUserContactList.save();

    // Return the response with both added contacts
    res.status(200).json({
      message: 'Contacts added successfully for both users',
      ownerContact: newContactForOwner,
      contactUserContact: newContactForContactUser
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    res.status(500).json({ message: 'Server error while adding contact' });
  }
};



exports.getContactListByOwnerNumber = async (req, res) => {
  const  ownerNumber=  req.user.phoneNumber  // Expecting the ownerNumber in the request body

  try {
    // Find the contact list by ownerNumber
    const contactList = await ContactList.findOne({ ownerNumber });

    // If the contact list does not exist, return an empty array with a 200 status
    if (!contactList) {
      return res.status(200).json([]);
    }

    // Return only the contacts array in reversed order
    res.status(200).json(contactList.contacts.reverse());
  } catch (error) {
    console.error("Error retrieving contact list:", error);
    res.status(500).json({ message: 'Server error while retrieving contact list' });
  }
};
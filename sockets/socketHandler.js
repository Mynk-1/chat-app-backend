// sockets/socketHandler.js
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const ContactList = require('../models/ContactList');


const connection = (io) => {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Listen for 'sendPhoneNumber' event from the client
    socket.on('sendPhoneNumber', async ({ phoneNumber, socketId }) => {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { phoneNumber },
          { socketId },
          { new: true }
        );

        if (updatedUser) {
          console.log(`Updated socket ID for user with phone number: ${phoneNumber}`);
        } else {
          console.log(`User with phone number ${phoneNumber} not found`);
        }
      } catch (error) {
        console.error('Error updating socket ID:', error);
      }
    });

    // Handle 'newMessage' event from the client
   // Handle 'newMessage' event from the client
   socket.on('newMessage', async ({ participant1, participant2, sender, content }) => {
    try {
      const conversationId = [participant1, participant2].sort((a, b) => a - b).join('_');
      const newMessage = {
        sender,
        content,
        read: false,
        timestamp: new Date(),
      };
  
      // Use findOneAndUpdate with upsert to create or update the conversation
      const conversation = await Conversation.findOneAndUpdate(
        { conversationId },                               // Search by conversationId
        {                                                 // Update operation
          $setOnInsert: {
            participants: [participant1, participant2],   // Set participants if creating new conversation
            conversationId                                // Set conversationId if creating new conversation
          },
          $push: { messages: newMessage }                 // Always add the new message
        },
        { new: true, upsert: true }                       // Return the updated doc, create if not found
      );
  
      // Emit the updated message to the sender's socket
      io.to(socket.id).emit("updatedMessage", newMessage);
      console.log(`Message ${conversation ? "updated" : "created"} in conversation:`, newMessage);
  
      // Find participant2's user info to check socketId and handle unreadMessageCount
      const participant2User = await User.findOne({ phoneNumber: participant2 });
  
      if (participant2User) {
        // Update unreadMessageCount for the sender in participant2's contact list
        const contactList = await ContactList.findOne({ ownerNumber: participant2 });
        if (contactList) {
          // Find the contact representing the sender
          const contact = contactList.contacts.find(c => c.contactNumber === sender);
          if (contact) {
            contact.unreadMessageCount += 1;  // Increment unread count
          } else {
            console.warn(`Contact for sender ${sender} not found in participant2's contact list`);
          }
          await contactList.save();
  
          console.log(`Unread message count updated for ${sender} in ${participant2}'s contact list`);
  
          // Check if participant2's socket is connected and emit updated contact list
          if (participant2User.socketId && io.sockets.sockets.has(participant2User.socketId)) {
            io.to(participant2User.socketId).emit("updatedContactList", contactList.contacts.reverse());
            io.to(participant2User.socketId).emit("updatedMessage", newMessage);
            console.log(`Updated contact list sent to participant2 (Socket ID: ${participant2User.socketId})`);
          } else {
            console.log(`Participant2 (Phone: ${participant2}) is not connected`);
          }
        } else {
          console.warn(`No contact list found for participant2: ${participant2}`);
        }
      }
  
    } catch (error) {
      console.error('Error handling newMessage event:', error);
    }
  });
  


socket.on('addContact', async ({ ownerNumber, contactNumber }) => {
  try {
    console.log(`Received request to add contact: ownerNumber=${ownerNumber}, contactNumber=${contactNumber}`);

    // Find both users
    const owner = await User.findOne({ phoneNumber: ownerNumber });
    const contactUser = await User.findOne({ phoneNumber: contactNumber });

    if (!owner || !contactUser) {
      console.log('One or both users not found');
      socket.emit('addContactResponse', { status: 'error', message: 'User not found' });
    } else {
      console.log('Both users found:', { owner, contactUser });

      // Find or create the owner's contact list
      let ownerContactList = await ContactList.findOne({ ownerNumber });
      if (!ownerContactList) {
        console.log(`Owner contact list not found, creating new for ownerNumber=${ownerNumber}`);
        ownerContactList = new ContactList({ ownerNumber, contacts: [] });
      } else {
        console.log(`Owner contact list found for ownerNumber=${ownerNumber}`);
      }

      // Check if the contact already exists in the owner's contact list
      const existingOwnerContact = ownerContactList.contacts.find(contact => contact.contactNumber === contactNumber);
      if (existingOwnerContact) {
        console.log('Contact already exists in owner\'s contact list');
        socket.emit('addContactResponse', { status: 'error', message: 'Contact already exists' });
      } else {
        // Add contact to owner's contact list
        ownerContactList.contacts.push({
          contactNumber: contactUser.phoneNumber,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadMessageCount: 0
        });
        await ownerContactList.save();
        console.log('Contact added to owner\'s contact list:', { ownerContactList });
      }

      // Find or create the contact user's contact list
      let contactUserContactList = await ContactList.findOne({ ownerNumber: contactNumber });
      if (!contactUserContactList) {
        console.log(`Contact user's contact list not found, creating new for contactNumber=${contactNumber}`);
        contactUserContactList = new ContactList({ ownerNumber: contactNumber, contacts: [] });
      } else {
        console.log(`Contact user's contact list found for contactNumber=${contactNumber}`);
      }

      // Check if the owner already exists in the contact user's contact list
      const existingContactUserContact = contactUserContactList.contacts.find(contact => contact.contactNumber === ownerNumber);
      if (existingContactUserContact) {
        console.log('Owner already exists in contact user\'s contact list');
        socket.emit('addContactResponse', { status: 'error', message: 'Owner already exists in contact list' });
      } else {
        // Add owner to contact user's contact list
        contactUserContactList.contacts.push({
          contactNumber: owner.phoneNumber,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadMessageCount: 0
        });
        await contactUserContactList.save();
        console.log('Owner added to contact user\'s contact list:', { contactUserContactList });
      }

      // Emit success response to the socket that triggered the add contact request
      socket.emit('addContactResponse', {
        status: 'success',
        message: 'Contacts added successfully for both users'
      });
      console.log('Success response emitted to client');
    }

    // Emit the updated contact list to the owner if connected
    const ownerContactListUpdated = await ContactList.findOne({ ownerNumber });
    if (owner && owner.socketId && io.sockets.sockets.has(owner.socketId)) {
      io.to(owner.socketId).emit('updatedContactList', ownerContactListUpdated.contacts.reverse());
      console.log('Updated contact list emitted to owner:', { ownerContactListUpdated });
    } else {
      console.log('Owner is not connected or does not have a socket ID, skipping updated contact list emit');
    }

    // Emit the updated contact list to the contact user if connected
    const contactUserContactListUpdated = await ContactList.findOne({ ownerNumber: contactNumber });
    if (contactUser && contactUser.socketId && io.sockets.sockets.has(contactUser.socketId)) {
      io.to(contactUser.socketId).emit('updatedContactList', contactUserContactListUpdated.contacts.reverse());
      console.log('Updated contact list emitted to contact user:', { contactUserContactListUpdated });
    } else {
      console.log('Contact user is not connected or does not have a socket ID, skipping updated contact list emit');
    }

  } catch (error) {
    console.error("Error adding contact:", error);
    socket.emit('addContactResponse', { status: 'error', message: 'Server error while adding contact' });
  }
});

socket.on('updateUnreadMessageCount', async ({ currentUser, myNumber }) => {
  try {
    console.log("Received updateUnreadMessageCount event:", { currentUser, myNumber });

    // Find the contact list of `myNumber`
    const contactList = await ContactList.findOne({ ownerNumber: myNumber });
    console.log(`Contact list found for ${myNumber}:`, contactList);

    if (contactList) {
      // Find the contact entry for `currentUser` in `myNumber`'s contact list
      const contact = contactList.contacts.find(contact => contact.contactNumber === currentUser);
      
      if (contact) {
        // Set unread message count to zero for the contact
        contact.unreadMessageCount = 0;
        await contactList.save();
        console.log(`Unread message count reset for ${currentUser} in ${myNumber}'s contact list`);
        
        // Emit the updated contact list to the socket for `myNumber`
        const updatedContactList = await ContactList.findOne({ ownerNumber: myNumber });
        socket.emit('updatedContactList', updatedContactList.contacts.reverse());
        console.log(`Updated contact list emitted to socket for ${myNumber}`);
      } else {
        console.log(`Contact ${currentUser} not found in ${myNumber}'s contact list`);
      }
    } else {
      console.log(`Contact list not found for ${myNumber}`);
    }
  } catch (error) {
    console.error("Error in updateUnreadMessageCount:", error);
  }
});



    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = connection;

const Conversation = require('../models/Conversation'); // Import the Conversation model

// Function to create a conversation (if it doesn't exist) and send a message in that conversation
exports.createConversationAndSendMessage = async (req, res) => {
  const { participant1=req.user.phoneNumber, participant2, sender, content } = req.body;

  // Generate a unique conversation ID by sorting participants' phone numbers
  const conversationId = [participant1, participant2].sort((a, b) => a - b).join('_');

  try {
    // Define the new message
    const newMessage = {
      sender,
      content,
      timestamp: new Date()
    };

    // Use findOneAndUpdate with upsert to create the conversation if it doesn’t exist, or update it
    const conversation = await Conversation.findOneAndUpdate(
      { conversationId },                               // Search criteria
      {                                                 // Update operation
        $setOnInsert: {
          participants: [participant1, participant2],   // Set participants only if inserting
          conversationId
        },
        $push: { messages: newMessage }                 // Always push the new message
      },
      { new: true, upsert: true }                       // Options: return the modified document, create if not found
    );

    res.status(200).json({ message: 'Message sent successfully', conversation });
  } catch (error) {
    console.error("Error creating conversation and sending message:", error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Function to retrieve messages from a conversation in descending order (latest first)
exports.getMessages = async (req, res) => {
  const { participant1=req.user.phoneNumber , participant2 } = req.body;

  // Generate the unique conversation ID based on sorted participants
  const conversationId = [participant1, participant2].sort((a, b) => a - b).join('_');

  try {
    // Find the conversation by conversationId
    const conversation = await Conversation.findOne({ conversationId });

    // Check if the conversation exists
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Return messages sorted in descending order by timestamp
    const sortedMessages = conversation.messages.sort((a, b) => b.timestamp - a.timestamp);
    res.status(200).json(sortedMessages.reverse());
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ message: 'Server error' });
  }
};



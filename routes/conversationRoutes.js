const express = require('express');
const conversationController = require('../controllers/conversationController');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

// Route to create a conversation and send a message
router.post('/conversation/addmessage',authenticate, conversationController.createConversationAndSendMessage);

// Route to get all messages in a conversation (latest messages first)
router.post('/conversation/getmessage',authenticate, conversationController.getMessages);

module.exports = router;

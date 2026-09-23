const express = require('express');
const chatController = require('../controllers/chat.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/', chatController.getChats);

module.exports = router;

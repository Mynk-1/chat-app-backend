const express = require('express');
const messageController = require('../controllers/message.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/', messageController.sendMessage);
router.get('/:contactNumber', messageController.getMessages);
router.post('/:contactNumber/read', messageController.markRead);

module.exports = router;

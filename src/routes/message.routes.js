const express = require('express');
const messageController = require('../controllers/message.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/', messageController.sendMessage);
// Static-prefix group routes must come before the generic /:contactNumber
// routes below, or "group" would be matched as a contactNumber value.
router.get('/group/:groupId', messageController.getGroupMessages);
router.post('/group/:groupId/read', messageController.markGroupRead);
router.get('/:contactNumber', messageController.getMessages);
router.post('/:contactNumber/read', messageController.markRead);

module.exports = router;

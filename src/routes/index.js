const express = require('express');
const authRoutes = require('./auth.routes');
const contactRoutes = require('./contact.routes');
const messageRoutes = require('./message.routes');
const callRoutes = require('./call.routes');
const chatRoutes = require('./chat.routes');
const groupRoutes = require('./group.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/messages', messageRoutes);
router.use('/calls', callRoutes);
router.use('/chats', chatRoutes);
router.use('/groups', groupRoutes);
router.use('/users', userRoutes);

module.exports = router;

const express = require('express');
const authRoutes = require('./auth.routes');
const contactRoutes = require('./contact.routes');
const messageRoutes = require('./message.routes');
const callRoutes = require('./call.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/messages', messageRoutes);
router.use('/calls', callRoutes);

module.exports = router;

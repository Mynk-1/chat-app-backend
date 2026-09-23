const express = require('express');
const callController = require('../controllers/call.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/', callController.getCallHistory);

module.exports = router;

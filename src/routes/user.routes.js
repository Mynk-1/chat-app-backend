const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/:phoneNumber', userController.lookupUser);

module.exports = router;

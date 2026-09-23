const express = require('express');
const groupController = require('../controllers/group.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.post('/', groupController.createGroup);

module.exports = router;

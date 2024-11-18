const express = require('express');
const userController = require('../controllers/addContact');
const authenticate = require('../middleware/authMiddleware');
const router = express.Router();

// Existing route for finding a user
router.get('/get-contact', authenticate, userController.getContactListByOwnerNumber);

// New route for adding a contact by phone number
router.post('/add-contact', authenticate , userController.addContactByPhoneNumber);

module.exports = router;

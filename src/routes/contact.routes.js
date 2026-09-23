const express = require('express');
const contactController = require('../controllers/contact.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);
router.get('/', contactController.getContacts);
router.post('/', contactController.addContact);
router.patch('/:contactNumber', contactController.updateContactProfile);

module.exports = router;

// routes/authRoutes.js
const express = require('express');
const { loginOrRegister, getProfile } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginOrRegister);
router.get('/profile', authenticate, getProfile);

module.exports = router;

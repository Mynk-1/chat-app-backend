const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;

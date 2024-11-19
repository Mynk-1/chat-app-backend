const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

exports.loginOrRegister = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Check if the user already exists
    console.log(phoneNumber);
    let user = await User.findOne({ phoneNumber });

    // If the user does not exist, create a new one
    let isNewUser = false;
    if (!user) {
      user = new User({ phoneNumber });
      isNewUser = true;
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    // Send the token in the response body
    res.json({
      success: true,
      message: isNewUser ? 'Registered successfully' : 'Logged in successfully',
      token,  // Return the token in the response body
      user
    });

  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};


exports.getProfile = (req, res) => {
  // Ensure req.user exists
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  res.json(req.user);
};

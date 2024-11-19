const User = require('../models/User');
const { generateToken } = require('../utils/jwtUtils');

exports.loginOrRegister = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    // Check if the user already exists
    console.log(phoneNumber)
    let user = await User.findOne({ phoneNumber });
    
    // If the user does not exist, create a new one
    let isNewUser = false;
    if (!user) {
      user = new User({ phoneNumber });
      isNewUser = true;
      await user.save();
    }

    // Generate token and set cookie
    const token = generateToken(user._id);
    res.cookie('token', token, {
      httpOnly: true,  // Prevents access to the cookie via JavaScript (helps prevent XSS attacks)
      secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production (HTTPS)
      sameSite: 'Strict',  // SameSite=Lax or Strict restricts cross-site requests (protects from CSRF)
      maxAge: 3600000,  // Cookie expiration time (1 hour in milliseconds)
      // The cookie will only be available to this subdomain unless both frontend and backend are on the same domain
      domain: '.onrender.com',  // This is for all subdomains of onrender.com (e.g., frontend.onrender.com)
    });

    res.json({
      success: true,
      message: isNewUser ? 'Registered successfully' : 'Logged in successfully',
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

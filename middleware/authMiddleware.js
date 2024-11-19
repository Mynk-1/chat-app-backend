// middleware/authMiddleware.js
const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  // Extract the token from the Authorization header (Bearer <token>)
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized: No authorization header' });
  }

  // Split the header into 'Bearer' and the token part
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    // Verify the token
    const decoded = verifyToken(token);
    
    // Attach the user to the request object
    req.user = await User.findById(decoded.id);
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

module.exports = authenticate;

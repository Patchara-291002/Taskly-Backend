const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = async (req, res, next) => {
    try {
      let token = req.headers.authorization?.split(' ')[1];
      
      if (!token && req.cookies) {
        token = req.cookies.token;
      }
      
      if (!token) {
        token = req.query.token;
      }
  
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
  
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id; // แก้จาก decoded.userId เป็น decoded.id
        next();
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
      }
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error during authentication' 
      });
    }
  };
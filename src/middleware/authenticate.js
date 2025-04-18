const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = async (req, res, next) => {
    try {
      // Log all possible token sources
      console.log('Auth Header:', req.headers.authorization);
      console.log('Cookies:', req.cookies);
      console.log('Query:', req.query);

      let token = req.headers.authorization?.split(' ')[1];
      
      if (!token && req.cookies) {
        token = req.cookies.token;
      }
      
      if (!token) {
        token = req.query.token;
      }
  
      if (!token) {
        console.log('No token found in any source');
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }

      console.log('Token found:', token.substring(0, 20) + '...');
      console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);
        req.userId = decoded.id;
        next();
      } catch (jwtError) {
        console.error('JWT verification failed:', {
          name: jwtError.name,
          message: jwtError.message,
          expiredAt: jwtError.expiredAt,
          token: token.substring(0, 20) + '...'
        });
        return res.status(401).json({ 
          success: false, 
          message: `Token invalid: ${jwtError.message}` 
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
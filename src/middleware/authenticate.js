const jwt = require('jsonwebtoken');
require('dotenv').config()

const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.userId = decoded.id;
        next();
    })
}
module.exports = authenticate;
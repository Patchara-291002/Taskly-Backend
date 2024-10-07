const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');

require('dotenv').config();

router.get('/', async (req, res) => {
    const token = req.cookies.jwtToken;
    if (!token) {
        return res.redirect('/auth/login');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.send(`Hello, ${req.user.displayName}`);
    } catch (err) {
        res.clearCookie('jwtToken');
        return res.redirect('/auth/google');
    }
});

module.exports = router;
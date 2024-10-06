const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');

require('dotenv').config();

router.get('/', async (req, res) => {
    const token = req.cookies.jwt;
    if (!token) {
        return res.redirect('/');
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.send(`Hello, ${req.user.displayName}`);
    } catch (err) {
        res.clearCookie('jwt');
        return res.redirect('/auth/google');
    }
});

module.exports = router;
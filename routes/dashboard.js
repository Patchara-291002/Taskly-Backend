const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
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

router.get('/projects', async (req, res) => {
    try {
        const userId = req.query.userId; 
        const projects = await Project.find({ users: userId }).populate('users');
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});



module.exports = router;
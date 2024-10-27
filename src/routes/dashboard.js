const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
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

// router.get('/userprojects/:userId', async (req, res) => {
//     try {
//        const user = await User.findById(req.params.userId);
//        if (!user) {
//         return res.status(404).json({ error: 'User not found' });
//        }

//        const projects = await Project.find({ users: req.params.userId });

//        const userWithProjects = {
//         ...user.toObject(),
//         project: projects
//        }

//        res.status(200).json(userWithProjects);

//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch projects' });
//     }
// });



module.exports = router;
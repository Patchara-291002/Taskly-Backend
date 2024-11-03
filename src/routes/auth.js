const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/google', authController.googleAuth);

router.get('/login', authController.login);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  authController.googleCallback
);

router.get('/logout', authController.logout);

module.exports = router;

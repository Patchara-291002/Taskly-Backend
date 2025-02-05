const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');

// email
router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.getUserInfo);
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({ message: 'Logout successful' });
})

// google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '3d' });
    res.redirect(`${process.env.FRONTEND_URL}/login/google-callback?token=${token}`)
  }
);

module.exports = router;

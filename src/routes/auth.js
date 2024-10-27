const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');

// เรียกใช้การยืนยันตัวตนด้วย Google
router.get('/google', authController.googleAuth);

// เส้นทาง login
router.get('/login', authController.login);

// เส้นทาง callback สำหรับ Google authentication
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  authController.googleCallback // เพิ่มการเรียกใช้ googleCallback
);

// เส้นทาง logout
router.get('/logout', authController.logout); // เพิ่ม "/" ก่อน logout

module.exports = router;

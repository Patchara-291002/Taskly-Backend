const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authenticate = require('../middleware/authenticate');
const notificationController = require('../controllers/notificationController');

// ดึงการแจ้งเตือนทั้งหมด (5 วันย้อนหลัง)
router.get('/', authenticate, notificationController.getAllNotifications);

// อัพเดทสถานะการอ่านทั้งหมด
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead);

// Export the router
module.exports = router;
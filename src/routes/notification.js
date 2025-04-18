const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const notificationController = require('../controllers/notificationController');

// ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// ดึงการแจ้งเตือนทั้งหมด 5 วันย้อนหลัง
router.get('/', authenticate, notificationController.getAllNotifications);

// อัพเดทสถานะการอ่านทั้งหมด
router.put('/mark-all-read', authenticate, notificationController.markAllAsRead);

// Export the router
module.exports = router;
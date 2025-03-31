const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const authenticate = require('../middleware/authenticate');

/**
 * ดึงการแจ้งเตือนทั้งหมดของผู้ใช้
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id
    }).sort({ createdAt: -1 }).limit(50);
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงการแจ้งเตือน' });
  }
});

/**
 * ดึงเฉพาะการแจ้งเตือนที่ยังไม่ได้อ่าน
 */
router.get('/unread', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      status: 'unread'
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงการแจ้งเตือนที่ยังไม่ได้อ่าน' });
  }
});

/**
 * ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
 */
router.get('/unread/count', authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      status: 'unread'
    });
    
    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการนับการแจ้งเตือนที่ยังไม่ได้อ่าน' });
  }
});

/**
 * อ่านการแจ้งเตือน (อัพเดตสถานะเป็นอ่านแล้ว)
 */
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const notificationId = req.params.id;
    // Find the notification by ID and verify it belongs to the user
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user._id
    });

    // If notification doesn't exist or doesn't belong to user
    if (!notification) {
      return res.status(404).json({ message: 'ไม่พบการแจ้งเตือนนี้' });
    }

    // Update notification status to read
    notification.status = 'read';
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดตสถานะการแจ้งเตือน' });
  }
});

/**
 * อ่านการแจ้งเตือนทั้งหมด (อัพเดตสถานะเป็นอ่านแล้วทั้งหมด)
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, status: 'unread' },
      { $set: { status: 'read' } }
    );

    res.json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `อัพเดตการแจ้งเตือน ${result.modifiedCount} รายการเป็นอ่านแล้ว`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัพเดตสถานะการแจ้งเตือนทั้งหมด' });
  }
});

/**
 * ลบการแจ้งเตือนตาม ID
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const result = await Notification.deleteOne({
      _id: notificationId,
      userId: req.user._id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'ไม่พบการแจ้งเตือนนี้หรือไม่มีสิทธิ์ลบ' });
    }

    res.json({ success: true, message: 'ลบการแจ้งเตือนเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบการแจ้งเตือน' });
  }
});

/**
 * ลบการแจ้งเตือนที่อ่านแล้วทั้งหมด
 */
router.delete('/clear/read', authenticate, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      status: 'read'
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `ลบการแจ้งเตือนที่อ่านแล้ว ${result.deletedCount} รายการ`
    });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบการแจ้งเตือนที่อ่านแล้ว' });
  }
});

/**
 * ลบการแจ้งเตือนทั้งหมดของผู้ใช้
 */
router.delete('/clear/all', authenticate, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `ลบการแจ้งเตือนทั้งหมด ${result.deletedCount} รายการ`
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบการแจ้งเตือนทั้งหมด' });
  }
});

// Export the router
module.exports = router;
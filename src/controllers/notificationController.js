const Course = require('../models/Course');
const Notification = require('../models/Notification');

// ดึงการแจ้งเตือนย้อนหลัง 5 วัน
exports.getAllNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const notifications = await Notification.find({
            userId: userId,
            createdAt: { $gte: fiveDaysAgo }
        })
        .sort({ createdAt: -1 })
        .lean();

        res.status(200).json({
            success: true,
            notifications
        });

    } catch (error) {
        console.error("❌ Error fetching notifications:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน',
            error: error.message
        });
    }
};

// อัพเดทสถานะการอ่านทั้งหมด
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const result = await Notification.updateMany(
            {
                userId: userId,
                status: 'unread',
                createdAt: { $gte: fiveDaysAgo }
            },
            {
                $set: { status: 'read' }
            }
        );

        res.status(200).json({
            success: true,
            message: 'อัพเดตสถานะการอ่านทั้งหมดแล้ว',
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error("❌ Error marking notifications as read:", error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัพเดตสถานะการอ่าน',
            error: error.message
        });
    }
};
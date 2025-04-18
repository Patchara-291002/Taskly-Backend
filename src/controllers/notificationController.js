const Notification = require('../models/Notification');

exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.userId;
        const count = await Notification.countDocuments({
            userId: userId,
            status: 'unread'
        });

        res.json({
            success: true,
            count: count
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting unread count'
        });
    }
};

exports.getAllNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const notifications = await Notification.find({
            userId: userId,  // Changed from req.user._id to userId
            createdAt: { $gte: fiveDaysAgo }
        })
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting notifications'
        });
    }
};

exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        await Notification.updateMany(
            { 
                userId: userId,  // Changed from req.user._id to userId
                status: 'unread'
            },
            { 
                $set: { status: 'read' }
            }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error marking notifications as read'
        });
    }
};
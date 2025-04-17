const User = require('../../models/User');
const Notification = require('../../models/Notification');
const lineController = require('../../controllers/lineController');

class NotificationSender {
    static async send(userId, message, type, itemId) {
        try {
            // Create notification in database
            const notification = new Notification({
                userId,
                message,
                type,
                itemId,
                delivered: { web: true, line: false }
            });
            await notification.save();

            // Send LINE notification if available
            const user = await User.findById(userId).select('lineUserId');
            if (user?.lineUserId) {
                const result = await lineController.sendLineNotification(user.lineUserId, message);
                if (result?.success) {
                    notification.delivered.line = true;
                    await notification.save();
                }
            }

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }
}

module.exports = NotificationSender;
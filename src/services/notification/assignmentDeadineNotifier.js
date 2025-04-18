const cron = require('node-cron');
const Assignment = require('../../models/Assignment');
const Course = require('../../models/Course');
const Notification = require('../../models/Notification');
const NotificationSender = require('./notificationSender');

class AssignmentDeadlineNotifier {
    static initialize() {
        console.log('Initializing assignment deadline notifier...');
        
        cron.schedule('0 7 * * *', async () => {
            await this.checkDeadlines();
        }, {
            timezone: "Asia/Bangkok"
        });
    }

    static async checkDeadlines() {
        try {
            const unfinishedAssignments = await Assignment.find({
                status: { $ne: 'Done' }
            }).populate('courseId');

            for (const assignment of unfinishedAssignments) {
                const dueDate = new Date(assignment.endDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);

                const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                if (daysLeft <= 3 && daysLeft >= -1) {
                    let message;
                    if (daysLeft === -1) {
                        message = `📚 งาน ${assignment.assignmentName} วิชา ${assignment.courseId.courseName} เลยกำหนดส่งมา 1 วันแล้ว`;
                    } else if (daysLeft === 0) {
                        message = `📚 งาน ${assignment.assignmentName} วิชา ${assignment.courseId.courseName} ครบกำหนดส่งวันนี้`;
                    } else {
                        message = `📚 งาน ${assignment.assignmentName} วิชา ${assignment.courseId.courseName} จะครบกำหนดส่งในอีก ${daysLeft} วัน`;
                    }

                    await this.notifyDeadline(assignment, 'assignment', message);
                }
            }
        } catch (error) {
            console.error('Error checking assignment deadlines:', error);
        }
    }

    static async notifyDeadline(assignment, notificationType, message) {
        try {
            const course = await Course.findById(assignment.courseId);
            if (!course) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const existingNotification = await Notification.findOne({
                userId: course.userId,
                type: notificationType,
                itemId: assignment._id,
                createdAt: { $gte: today }
            });

            if (existingNotification) return;

            await NotificationSender.send(
                course.userId,
                message,
                notificationType,
                assignment._id
            );
        } catch (error) {
            console.error('Error notifying deadline:', error);
        }
    }
}

module.exports = AssignmentDeadlineNotifier;
const cron = require('node-cron');
const Task = require('../../models/Task');
const Project = require('../../models/Project');
const Status = require('../../models/Status');
const Notification = require('../../models/Notification');
const NotificationSender = require('./notificationSender');

class TaskDeadlineNotifier {
    static initialize() {
        console.log('Initializing task deadline notifier...');
        
        // เช็คทุกวันตอน 7 โมงเช้า
        cron.schedule('0 7 * * *', async () => {
            console.log('Checking task deadlines...');
            await this.checkDeadlines();
        }, {
            timezone: "Asia/Bangkok"
        });
    }

    static async checkDeadlines() {
        try {
            const now = new Date();

            // หา tasks ที่ยังไม่เสร็จ
            const unfinishedTasks = await Task.find({
                'statusId': {
                    $in: await Status.find({ isDone: false }).distinct('_id')
                }
            }).populate('statusId', 'projectId');


            for (const task of unfinishedTasks) {
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                dueDate.setHours(0, 0, 0, 0);

                // คำนวณจำนวนวันที่เหลือ
                const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

                if (daysLeft <= 3 && daysLeft >= -1) {
                    let message;
                    if (daysLeft === -1) {
                        message = `❌ งาน ${task.taskName} เลยกำหนดส่งมา 1 วันแล้ว`;
                    } else if (daysLeft === 0) {
                        message = `⏰ งาน ${task.taskName} ครบกำหนดส่งวันนี้`;
                    } else {
                        message = `📅 งาน ${task.taskName} จะครบกำหนดส่งในอีก ${daysLeft} วัน`;
                    }

                    await this.notifyDeadline(task, 'task-deadline', message);
                }
            }
        } catch (error) {
            console.error('Error checking deadlines:', error);
        }
    }

    static async notifyDeadline(task, notificationType, message) {
        try {
            const project = await Project.findById(task.statusId.projectId);
            if (!project) {
                console.log('Project not found for task:', task._id);
                return;
            }

            const usersWithRole = project.users.filter(user =>
                user.projectRole?.roleId.toString() === task.roleId._id.toString()
            );

            for (const user of usersWithRole) {
                // เช็คว่าวันนี้เคยส่งแจ้งเตือนไปแล้วหรือยัง
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const existingNotification = await Notification.findOne({
                    userId: user.userId,
                    type: notificationType,
                    itemId: task._id,
                    createdAt: { $gte: today }
                });

                if (existingNotification) {
                    continue;
                }

                console.log(`Sending notification to user ${user.userId}`);
                await NotificationSender.send(
                    user.userId,
                    message,
                    notificationType,
                    task._id
                );
            }
        } catch (error) {
            console.error('Error notifying deadline:', error);
        }
    }
}

module.exports = TaskDeadlineNotifier;
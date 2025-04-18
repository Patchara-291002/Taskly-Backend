const cron = require('node-cron');
const mongoose = require('mongoose');
const Task = require('../../models/Task');
const Project = require('../../models/Project');
const Status = require('../../models/Status');
const Notification = require('../../models/Notification');
const NotificationSender = require('./notificationSender');

class ProjectTaskNotifier {
    static initialize() {
        console.log('Initializing project task notifier...');

        cron.schedule('* * * * *', async () => {
            console.log('Checking new task assignments...');
            await this.checkAndNotifyTasks();
        }, {
            timezone: "Asia/Bangkok"
        });
    }

    static async checkAndNotifyTasks() {
        try {
            // หา tasks ที่ยังไม่เคยแจ้งเตือน
            const unfinishedTasks = await Task.find({
                'statusId': {
                    $in: await Status.find({ isDone: false }).distinct('_id')
                },
                'roleId': { $exists: true, $ne: null },
                'notified': { $ne: true } // เพิ่มเงื่อนไขเช็คว่ายังไม่เคยแจ้งเตือน
            })
                .populate('statusId', 'projectId')
                .populate('roleId', '_id');

            for (const task of unfinishedTasks) {
                await this.notifyUsersForTask(task);

                // อัพเดตสถานะว่าได้แจ้งเตือนแล้ว
                await Task.findByIdAndUpdate(task._id, { notified: true });
            }
        } catch (error) {
            console.error('Error checking project tasks:', error);
        }
    }

    static async notifyUsersForTask(task) {
        try {
            const project = await Project.findById(task.statusId.projectId);
            if (!project) return;

            const usersWithRole = project.users.filter(user => {
                return user.projectRole?.roleId.toString() === task.roleId._id.toString() &&
                    mongoose.Types.ObjectId.isValid(user.userId);
            });

            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            if (!dueDate) {
                console.log(`Task ${task._id} has no due date`);
                return;
            }

            const today = new Date();
            const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            const thaiDate = new Intl.DateTimeFormat('th-TH', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(dueDate);

            for (const user of usersWithRole) {
                // เช็คว่าเคยส่งการแจ้งเตือนสำหรับ task นี้ให้ user นี้แล้วหรือยัง
                const existingNotification = await Notification.findOne({
                    userId: user.userId,
                    type: 'task-assigned',
                    itemId: task._id
                });

                if (existingNotification) {
                    // console.log(`Notification already sent for task ${task._id} to user ${user.userId}`);
                    continue;
                }

                const message = `📋 คุณได้รับมอบหมายงาน ${task.taskName}\n` +
                    `🏢 จากโปรเจค ${project.projectName}\n` +
                    `📅 ครบกำหนดวันที่ ${thaiDate}\n` +
                    `⏰ เหลือเวลาอีก ${daysLeft} วัน`;

                try {
                    await NotificationSender.send(user.userId, message, 'task-assigned', task._id);
                } catch (sendError) {
                    console.error(`Failed to send notification to user ${user.userId}:`, sendError.message);
                }
            }
        } catch (error) {
            console.error('Error notifying users for task:', error);
        }
    }
}

module.exports = ProjectTaskNotifier;
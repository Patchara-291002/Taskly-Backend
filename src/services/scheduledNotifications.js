const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const lineController = require('../controllers/lineController');

// เก็บข้อมูลการแจ้งเตือนล่าสุดเพื่อป้องกันการแจ้งเตือนซ้ำ (เป็น in-memory cache)
const lastNotifications = {};

/**
 * ฟังก์ชันตรวจสอบงานทั้งหมดและคำนวณเวลาที่เหลือ
 */
const checkDeadlinesAndNotify = async () => {
  try {
    console.log('Starting to check deadlines and notify users...');
    
    const now = new Date();
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    // กำหนดข้อความแจ้งเตือนตามเกณฑ์เวลา พร้อม notificationType ที่สอดคล้องกัน
    const thresholds = [
      { notificationType: 1, maxMs: SIX_HOURS_MS, message: '⚠️ งานใกล้ครบกำหนดแล้ว! (อีก 6 ชั่วโมง)' },
      { notificationType: 2, maxMs: ONE_DAY_MS, message: '🔔 เตือน! งานของคุณกำลังจะครบกำหนดภายใน 24 ชั่วโมง' },
      { notificationType: 3, maxMs: THREE_DAYS_MS, message: '📅 แจ้งเตือน: งานของคุณจะครบกำหนดภายใน 3 วัน' }
    ];

    const tasksWithAssignees = await Task.find({
      assignees: { $exists: true, $ne: [] }
    });

    const notificationsSent = { total: 0, line: 0 };

    for (const task of tasksWithAssignees) {
      const dueDate = new Date(task.dueDate);
      const timeLeftMs = dueDate - now;

      // เลยกำหนดใช้ notificationType 0 (ถ้าต้องการแจ้งเตือนงานเลยกำหนด)
      if (timeLeftMs <= 0) {
        // หากต้องการแจ้งเตือนงานที่เลยกำหนดแล้ว ใช้โค้ดส่วนนี้ 
        // ปัจจุบันข้ามไป (continue)
        continue;
      }

      let matchedThreshold = null;
      if (timeLeftMs <= SIX_HOURS_MS) {
        matchedThreshold = thresholds[0]; // notificationType 1
      } else if (timeLeftMs <= ONE_DAY_MS) {
        matchedThreshold = thresholds[1]; // notificationType 2
      } else if (timeLeftMs <= THREE_DAYS_MS) {
        matchedThreshold = thresholds[2]; // notificationType 3
      } else {
        continue;
      }

      if (matchedThreshold) {
        for (const assigneeId of task.assignees) {
          try {
            const user = await User.findById(assigneeId);
            if (!user) continue;

            // ตรวจสอบว่ามีการแจ้งเตือนประเภทเดียวกันสำหรับงานนี้และผู้ใช้นี้แล้วหรือไม่
            const existingNotification = await Notification.findOne({
              userId: user._id,
              itemId: task._id,
              itemType: 'task',
              notificationType: matchedThreshold.notificationType
            });
            
            // ถ้ามีการแจ้งเตือนประเภทเดียวกันอยู่แล้ว ให้ข้ามไป
            if (existingNotification) {
              continue;
            }

            const notification = new Notification({
              userId: user._id,
              title: matchedThreshold.message,
              content: task.taskName || task.title || 'ไม่ระบุชื่องาน',
              itemType: 'task',
              itemId: task._id,
              contextType: 'project',
              contextId: task.projectId || null,
              contextName: task.projectName || 'โปรเจกต์',
              dueDate: dueDate,
              status: 'unread',
              notificationType: matchedThreshold.notificationType,
              delivered: { line: false, web: true }
            });

            try {
              await notification.save();
              notificationsSent.total++;

              if (user.lineUserId) {
                const formatDueDate = dueDate.toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                const message = `${matchedThreshold.message}\n\n📌 งาน: ${task.taskName || task.title || 'ไม่ระบุชื่องาน'}\n⏰ กำหนดส่ง: ${formatDueDate}`;
                const result = await lineController.sendLineNotification(user._id, message);

                if (result && result.success) {
                  notification.delivered.line = true;
                  await notification.save();
                  notificationsSent.line++;
                }
              }
            } catch (saveError) {
              console.error(`Error saving notification: ${saveError.message}`);
            }
          } catch (userError) {
            console.error(`Error looking up user ${assigneeId}: ${userError.message}`);
          }
        }
      }
    }

    console.log(`Notifications created: ${notificationsSent.total}, LINE messages sent: ${notificationsSent.line}`);
    return notificationsSent;
  } catch (error) {
    console.error('Error checking deadlines and notifying:', error);
    return null;
  }
};

/**
 * ตั้งค่าการทำงานตามกำหนดเวลา
 */
const setupScheduledJobs = () => {
  // ตรวจสอบงานทุกชั่วโมง
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled deadline check...');
    await checkDeadlinesAndNotify();
  });
  
  // เริ่มตรวจสอบทันทีที่เริ่มระบบ
  setTimeout(async () => {
    console.log('Running initial deadline check...');
    await checkDeadlinesAndNotify();
  }, 5000);
  
  console.log('Notification scheduler initialized');
};

// ส่งออกฟังก์ชัน
module.exports = {
  checkDeadlinesAndNotify,
  setupScheduledJobs
};
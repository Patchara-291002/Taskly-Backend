const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');

// เก็บข้อมูลการแจ้งเตือนล่าสุดเพื่อป้องกันการสร้าง notifications ซ้ำ (เป็น in-memory cache)
const lastNotifications = {};

/**
 * ตรวจสอบและสร้างการแจ้งเตือนในฐานข้อมูล
 */
const checkDeadlines = async () => {
  try {
    console.log('Running deadline check at:', new Date().toLocaleString());
    
    // ดึงผู้ใช้ทั้งหมด
    const users = await User.find({});
    console.log(`Found ${users.length} users to check for notifications`);
    
    const now = new Date();
    
    // สร้างช่วงเวลาสำหรับการตรวจสอบ
    const thresholds = [
      { hours: 6, message: "⚠️ เหลือเวลาอีกเพียง 6 ชั่วโมง!" },
      { days: 1, message: "⚠️ กำหนดส่งคือพรุ่งนี้!" },
      { days: 3, message: "📝 เตือนความจำ: เหลือเวลาอีก 3 วัน" }
    ];
    
    for (const user of users) {
      // เตรียม cache สำหรับการแจ้งเตือน
      if (!lastNotifications[user._id]) {
        lastNotifications[user._id] = {};
      }
      
      // ตรวจสอบงานแต่ละประเภท
      await checkTasksForUser(user, now, thresholds);
      await checkAssignmentsForUser(user, now, thresholds);
    }
    
    console.log('Deadline check completed');
  } catch (error) {
    console.error('Error checking deadlines:', error);
  }
};

/**
 * ตรวจสอบ Tasks และสร้าง notifications ถ้าจำเป็น
 */
const checkTasksForUser = async (user, now, thresholds) => {
  // ดึงงาน Tasks ทั้งหมดที่ยังไม่เสร็จ
  const tasks = await Task.find({
    assignedTo: user._id,
    status: { $ne: 'Done' },
    dueDate: { $gt: now } // ยังไม่เลยกำหนด
  }).populate('project');
  
  for (const task of tasks) {
    const dueDate = new Date(task.dueDate);
    const timeLeft = dueDate - now;
    const hoursLeft = timeLeft / (1000 * 60 * 60);
    const daysLeft = hoursLeft / 24;
    
    // ตรวจสอบแต่ละเกณฑ์เวลา
    for (const threshold of thresholds) {
      if (
        (threshold.hours && hoursLeft <= threshold.hours && hoursLeft > threshold.hours - 1) || 
        (threshold.days && daysLeft <= threshold.days && daysLeft > threshold.days - 0.2)
      ) {
        const notificationKey = `task_${task._id}_${threshold.hours || threshold.days}`;
        const lastNotified = lastNotifications[user._id][notificationKey];
        
        // ถ้ายังไม่เคยแจ้งเตือนในช่วงเวลานี้ (หรือแจ้งไปนานแล้ว > 20 ชั่วโมง)
        if (!lastNotified || (now - lastNotified) > 20 * 60 * 60 * 1000) {
          // สร้างการแจ้งเตือนในฐานข้อมูล
          const notification = new Notification({
            userId: user._id,
            title: threshold.message,
            content: `งาน: ${task.title}`,
            itemType: 'task',
            itemId: task._id,
            contextId: task.project?._id,
            contextName: task.project?.name || 'ไม่มีโปรเจกต์',
            contextType: 'project',
            dueDate: dueDate,
            status: 'unread',
            thresholdType: threshold.hours ? 'hours' : 'days',
            thresholdValue: threshold.hours || threshold.days,
            delivered: { line: false, web: false }
          });
          
          await notification.save();
          console.log(`Created ${threshold.days ? threshold.days + ' days' : threshold.hours + ' hours'} notification for task ${task._id} to user ${user._id}`);
          
          // บันทึกเวลาที่สร้างแจ้งเตือนล่าสุด (เฉพาะใน memory)
          lastNotifications[user._id][notificationKey] = now;
          
          break; // สร้างเตือนเพียงระดับเดียวต่องาน
        }
      }
    }
  }
};

/**
 * ตรวจสอบ Assignments และสร้าง notifications ถ้าจำเป็น
 */
const checkAssignmentsForUser = async (user, now, thresholds) => {
  // ดึงงาน Assignments ทั้งหมด
  const assignments = await Assignment.find({
    students: user._id,
    endDate: { $gt: now } // ยังไม่เลยกำหนด
  }).populate('course');
  
  for (const assignment of assignments) {
    const dueDate = new Date(assignment.endDate);
    const timeLeft = dueDate - now;
    const hoursLeft = timeLeft / (1000 * 60 * 60);
    const daysLeft = hoursLeft / 24;
    
    // ตรวจสอบแต่ละเกณฑ์เวลา
    for (const threshold of thresholds) {
      if (
        (threshold.hours && hoursLeft <= threshold.hours && hoursLeft > threshold.hours - 1) || 
        (threshold.days && daysLeft <= threshold.days && daysLeft > threshold.days - 0.2)
      ) {
        const notificationKey = `assignment_${assignment._id}_${threshold.hours || threshold.days}`;
        const lastNotified = lastNotifications[user._id][notificationKey];
        
        // ถ้ายังไม่เคยแจ้งเตือนในช่วงเวลานี้ (หรือแจ้งไปนานแล้ว)
        if (!lastNotified || (now - lastNotified) > 20 * 60 * 60 * 1000) {
          // สร้างการแจ้งเตือนในฐานข้อมูล
          const notification = new Notification({
            userId: user._id,
            title: threshold.message,
            content: `งานส่ง: ${assignment.title}`,
            itemType: 'assignment',
            itemId: assignment._id,
            contextId: assignment.course?._id,
            contextName: assignment.course?.name || 'ไม่มีวิชา',
            contextType: 'course',
            dueDate: dueDate,
            status: 'unread',
            thresholdType: threshold.hours ? 'hours' : 'days',
            thresholdValue: threshold.hours || threshold.days,
            delivered: { line: false, web: false }
          });
          
          await notification.save();
          console.log(`Created ${threshold.days ? threshold.days + ' days' : threshold.hours + ' hours'} notification for assignment ${assignment._id} to user ${user._id}`);
          
          // บันทึกเวลาที่สร้างแจ้งเตือนล่าสุด (เฉพาะใน memory)
          lastNotifications[user._id][notificationKey] = now;
          
          break; // สร้างเตือนเพียงระดับเดียวต่องาน
        }
      }
    }
  }
};

/**
 * ตั้งค่าการทำงานตามกำหนดเวลา
 */
const setupScheduledJobs = () => {
  // ตรวจสอบทุกชั่วโมง
  cron.schedule('0 * * * *', () => {
    checkDeadlines();
  });
  
  // ตรวจสอบทันทีที่เริ่มระบบ
  checkDeadlines();
  
  console.log('Deadline notification scheduler initialized');
};

module.exports = {
  setupScheduledJobs,
  checkDeadlines
};
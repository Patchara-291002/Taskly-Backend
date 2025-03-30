const cron = require('node-cron');
const User = require('../models/User');
const Task = require('../models/Task');
const Assignment = require('../models/Assignment');
const lineController = require('../controllers/lineController');

// เก็บข้อมูลการแจ้งเตือนล่าสุดเพื่อป้องกันการแจ้งเตือนซ้ำ
const lastNotifications = {
  // userId: { taskId: timestamp, assignmentId: timestamp }
};

/**
 * ตรวจสอบและส่งแจ้งเตือนตามระยะเวลา
 */
const checkDeadlines = async () => {
  try {
    console.log('Running deadline check at:', new Date().toLocaleString());
    
    // ดึงผู้ใช้ที่สามารถรับการแจ้งเตือนได้
    const users = await User.find({ lineUserId: { $ne: null } });
    console.log(`Found ${users.length} users with LINE accounts`);
    
    const now = new Date();
    
    // สร้างช่วงเวลาสำหรับการตรวจสอบ
    const thresholds = [
      { hours: 6, message: "⚠️ เหลือเวลาอีกเพียง 6 ชั่วโมง!" },
      { days: 1, message: "⚠️ กำหนดส่งคือพรุ่งนี้!" },
      { days: 3, message: "📝 เตือนความจำ: เหลือเวลาอีก 3 วัน" }
    ];
    
    for (const user of users) {
      // เตรียมข้อมูลสำหรับการแจ้งเตือน
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
 * ตรวจสอบ Tasks สำหรับผู้ใช้คนหนึ่ง
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
        const lastNotified = lastNotifications[user._id][`task_${task._id}_${threshold.hours || threshold.days}`];
        
        // ถ้ายังไม่เคยแจ้งเตือนในช่วงเวลานี้ (หรือแจ้งไปนานแล้ว > 20 ชั่วโมง)
        if (!lastNotified || (now - lastNotified) > 20 * 60 * 60 * 1000) {
          // สร้างข้อความแจ้งเตือน
          const formatDueDate = dueDate.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const message = `${threshold.message}\n\n📌 งาน: ${task.title}\n📂 โปรเจกต์: ${task.project.name}\n⏰ กำหนดส่ง: ${formatDueDate}\n\n${getMotivationalQuote()}`;
          
          // ส่งข้อความแจ้งเตือน
          const result = await lineController.sendLineNotification(user._id, message);
          
          if (result.success) {
            console.log(`Sent ${threshold.days ? threshold.days + ' days' : threshold.hours + ' hours'} notification for task ${task._id} to user ${user._id}`);
            // บันทึกเวลาที่ส่งแจ้งเตือนล่าสุด
            lastNotifications[user._id][`task_${task._id}_${threshold.hours || threshold.days}`] = now;
          }
          
          break; // ส่งเตือนเพียงระดับเดียวต่องาน
        }
      }
    }
  }
};

/**
 * ตรวจสอบ Assignments สำหรับผู้ใช้คนหนึ่ง
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
        const lastNotified = lastNotifications[user._id][`assignment_${assignment._id}_${threshold.hours || threshold.days}`];
        
        // ถ้ายังไม่เคยแจ้งเตือนในช่วงเวลานี้ (หรือแจ้งไปนานแล้ว)
        if (!lastNotified || (now - lastNotified) > 20 * 60 * 60 * 1000) {
          // สร้างข้อความแจ้งเตือน
          const formatDueDate = dueDate.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const message = `${threshold.message}\n\n📚 งาน: ${assignment.title}\n📝 วิชา: ${assignment.course.name}\n⏰ กำหนดส่ง: ${formatDueDate}\n\n${getMotivationalQuote()}`;
          
          // ส่งข้อความแจ้งเตือน
          const result = await lineController.sendLineNotification(user._id, message);
          
          if (result.success) {
            console.log(`Sent ${threshold.days ? threshold.days + ' days' : threshold.hours + ' hours'} notification for assignment ${assignment._id} to user ${user._id}`);
            // บันทึกเวลาที่ส่งแจ้งเตือนล่าสุด
            lastNotifications[user._id][`assignment_${assignment._id}_${threshold.hours || threshold.days}`] = now;
          }
          
          break; // ส่งเตือนเพียงระดับเดียวต่องาน
        }
      }
    }
  }
};

/**
 * สร้างข้อความให้กำลังใจ
 */
const getMotivationalQuote = () => {
  const quotes = [
    "💪 คุณทำได้! อย่าลืมจัดการเวลาให้ดี",
    "🌟 เตรียมตัวให้พร้อม งานจะเสร็จทันเวลา",
    "🚀 ทำทีละขั้น แล้วทุกอย่างจะสำเร็จ",
    "⏳ อย่าผัดวันประกันพรุ่ง เริ่มต้นทำตั้งแต่วันนี้"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
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
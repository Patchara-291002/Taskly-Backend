// const cron = require('node-cron');
// const Notification = require('../models/Notification');
// const User = require('../models/User');

// /**
//  * ส่งการแจ้งเตือนผ่าน LINE โดยดึงจาก database
//  */
// const sendPendingNotifications = async () => {
//   try {
//     // ดึงการแจ้งเตือนที่ยังไม่ได้ส่งทาง LINE
//     const pendingNotifications = await Notification.find({ 
//       'delivered.line': false,
//       createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // เฉพาะ 24 ชม.ที่ผ่านมา
//     }).limit(100);

//     if (pendingNotifications.length === 0) return;
    
//     console.log(`Found ${pendingNotifications.length} pending LINE notifications`);
    
//     for (const notification of pendingNotifications) {
//       // ตรวจสอบว่า user มี LINE ID หรือไม่
//       const user = await User.findById(notification.userId);
//       if (!user || !user.lineUserId) continue;
      
//       // เตรียมข้อความ
//       const formatDueDate = notification.dueDate.toLocaleString('th-TH', {
//         year: 'numeric', month: 'long', day: 'numeric',
//         hour: '2-digit', minute: '2-digit'
//       });
      
//       // สร้างข้อความแบบเต็มสำหรับ LINE
//       const icon = notification.itemType === 'task' ? '📌' : '📚';
//       const contextIcon = notification.contextType === 'project' ? '📂' : '📝';
      
//       const message = `${notification.title}\n\n${icon} ${notification.content}\n${contextIcon} ${notification.contextType === 'project' ? 'โปรเจกต์' : 'วิชา'}: ${notification.contextName}\n⏰ กำหนดส่ง: ${formatDueDate}`;
      
//       try {
//         // ส่งข้อความแจ้งเตือนผ่าน LINE Controller
//         const lineController = require('../controllers/lineController');
//         const result = await lineController.sendLineNotification(user.lineUserId, message);
        
//         if (result.success) {
//           // อัปเดตสถานะการส่ง
//           notification.delivered.line = true;
//           await notification.save();
//           console.log(`Sent LINE notification ${notification._id} to user ${user._id}`);
//         } else {
//           console.error(`Failed to send LINE notification ${notification._id} to user ${user._id}`);
//         }
//       } catch (error) {
//         console.error(`Error in LINE notification sending: ${error.message}`);
//       }
//     }
//   } catch (error) {
//     console.error('Error sending LINE notifications:', error);
//   }
// };

// const setupLineNotificationService = () => {
//   // ตรวจสอบทุก 5 นาที
//   cron.schedule('*/5 * * * *', async () => {
//     await sendPendingNotifications();
//   });
  
//   // ตรวจสอบทันทีที่เริ่มระบบ
//   sendPendingNotifications();
  
//   console.log('LINE notification service initialized');
// };

// module.exports = {
//   setupLineNotificationService,
//   sendPendingNotifications
// };
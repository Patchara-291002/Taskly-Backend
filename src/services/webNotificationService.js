// const cron = require('node-cron');
// const Notification = require('../models/Notification');

// /**
//  * อัพเดตสถานะการแจ้งเตือน web เป็นพร้อมแสดงผล
//  */
// const updatePendingNotifications = async () => {
//   try {
//     // ค้นหาการแจ้งเตือนที่ยังไม่ได้ mark ว่าพร้อมแสดงผลบนเว็บ
//     const result = await Notification.updateMany(
//       { 'delivered.web': false },
//       { $set: { 'delivered.web': true } }
//     );
    
//     if (result.modifiedCount > 0) {
//       console.log(`Marked ${result.modifiedCount} notifications ready for web display`);
//     }
//   } catch (error) {
//     console.error('Error updating web notification status:', error);
//   }
// };

// /**
//  * ตั้งค่าการทำงานตามกำหนดเวลา
//  * คอยตรวจสอบและอัพเดตสถานะของการแจ้งเตือนที่ยังไม่ได้แสดงบนเว็บ
//  */
// const setupWebNotificationService = () => {
//   // ตรวจสอบทุก 3 นาที
//   cron.schedule('*/3 * * * *', async () => {
//     await updatePendingNotifications();
//   });
  
//   // ตรวจสอบทันทีที่เริ่มระบบ
//   updatePendingNotifications();
  
//   console.log('Web notification service initialized');
// };

// module.exports = {
//   setupWebNotificationService,
//   updatePendingNotifications
// };
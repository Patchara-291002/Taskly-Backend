const cron = require('node-cron');
const Course = require('../../models/Course');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const NotificationSender = require('./notificationSender');

class CourseScheduleNotifier {
    static initialize() {
        console.log('Initializing course schedule notifier...');
        
        // แจ้งเตือนทุก 15 นาทีเพื่อตรวจสอบรายวิชาที่กำลังจะเริ่มในอีก 1 ชั่วโมง
        cron.schedule('* * * * *', async () => {
            await this.checkUpcomingCourses();
        }, {
            timezone: "Asia/Bangkok"
        });
    }
    
    static async checkUpcomingCourses() {
        try {
            // รับวันและเวลาปัจจุบัน
            const now = new Date();
            const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const dayOfWeek = dayNames[now.getDay()];
            
            // แปลงเวลาปัจจุบันเป็นนาที (เช่น 9:30 = 9*60+30 = 570 นาที)
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeInMinutes = currentHour * 60 + currentMinute;
            
            console.log(`Checking upcoming courses for ${dayOfWeek} at ${currentHour}:${currentMinute}`);
            
            // หาคอร์สที่กำลังจะเริ่มในอีก ~1 ชั่วโมง
            const courses = await Course.find({ day: dayOfWeek });
            
            for (const course of courses) {
                // แปลงเวลาเริ่มเรียนเป็นนาที
                const [startHour, startMinute] = course.startTime.split(':').map(Number);
                const startTimeInMinutes = startHour * 60 + startMinute;
                
                // ตรวจสอบว่าเวลาเริ่มอยู่ในช่วง 55-65 นาทีข้างหน้า (ประมาณ 1 ชั่วโมง)
                const timeUntilStart = startTimeInMinutes - currentTimeInMinutes;
                if (timeUntilStart >= 55 && timeUntilStart <= 65) {
                    const user = await User.findById(course.userId);
                    if (!user || !user.lineUserId) continue;
                    
                    // ตรวจสอบว่าวันนี้เคยส่งแจ้งเตือนไปแล้วหรือยัง
                    const todayDate = new Date().toISOString().split('T')[0]; // เช่น "2025-04-21"
                    const notificationKey = `upcoming-${course._id}-${todayDate}`;
                    
                    const existingNotification = await Notification.findOne({
                        userId: course.userId,
                        type: 'course-upcoming',
                        itemId: course._id,
                        key: notificationKey
                    });
                    
                    if (existingNotification) {
                        console.log(`Notification already sent for course ${course.courseName}`);
                        continue;
                    }
                    
                    // สร้างข้อความแจ้งเตือน
                    const message = `⏰ อีก 1 ชั่วโมงจะถึงเวลาเรียนวิชา ${course.courseName}\n` +
                        `⏰ เวลา ${course.startTime} - ${course.endTime}`;
                    
                    console.log(`Sending notification for course ${course.courseName}`);
                    
                    // บันทึกการแจ้งเตือนและส่งข้อความ
                    const notification = new Notification({
                        userId: course.userId,
                        type: 'course-upcoming',
                        itemId: course._id,
                        key: notificationKey,
                        message: message
                    });
                    
                    await notification.save();
                    await NotificationSender.sendLineNotification(user.lineUserId, message);
                }
            }
            
        } catch (error) {
            console.error('Error checking upcoming courses:', error);
        }
    }
}

module.exports = CourseScheduleNotifier;
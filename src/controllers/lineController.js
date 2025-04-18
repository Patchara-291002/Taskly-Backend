const User = require('../models/User');
const axios = require('axios');
require('dotenv').config();

exports.handleWebhook = async (req, res) => {
    try {
        const events = req.body.events;
        console.log('Received LINE webhook:', events);

        // ตอบกลับทันทีเพื่อให้ LINE รู้ว่าได้รับข้อมูลแล้ว
        res.status(200).end();

        // ประมวลผลเหตุการณ์ต่างๆ
        for (const event of events) {
            // การจัดการกับข้อความที่ส่งมา
            if (event.type === 'message' && event.message.type === 'text') {
                // ตอบกลับข้อความอัตโนมัติ
                console.log('Received message:', event.message.text);
                // คุณสามารถเพิ่มโค้ดตอบกลับที่นี่
            }

            // การจัดการเมื่อมีคนเพิ่มบอทเป็นเพื่อน
            if (event.type === 'follow') {
                console.log('New user followed bot:', event.source.userId);
            }
        }
    } catch (error) {
        console.error('Error handling LINE webhook:', error);
        res.status(500).end();
    }
};

exports.linkLineAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const { lineUserId } = req.body;

        const existingUser = await User.findOne({ lineUserId });

        if (existingUser && existingUser._id.toString() !== userId) {
            return res.status(400).json({ message: 'Line account already linked to another user' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { lineUserId },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'Line account linked successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error link Line account', error: error.message });
    }
};

exports.sendLineNotification = async (lineUserId, message = 'Hi') => {
    try {
        if (!lineUserId) {
            console.log('No Line user ID provided');
            return { success: false, message: 'LINE user ID is required' };
        }

        try {
            const response = await axios({
                method: 'post',
                url: 'https://api.line.me/v2/bot/message/push',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
                },
                data: {
                    to: lineUserId,  // ใช้ lineUserId โดยตรง
                    messages: [
                        {
                            type: 'text',
                            text: message
                        }
                    ]
                }
            });

            console.log('LINE notification sent successfully');
            return { success: true, data: response.data };
        } catch (apiError) {
            console.error('LINE API Error:', apiError.response?.data || apiError.message);
            return {
                success: false,
                error: apiError.response?.data?.message || apiError.message,
                details: apiError.response?.data
            };
        }
    } catch (error) {
        console.error('Error sending LINE notification:', error.message);
        return { success: false, error: error.message };
    }
};

// สำหรับทดสอบการส่งข้อความ
exports.testSendNotification = async (req, res) => {
    try {
        const userId = req.userId; // ใช้ userId จาก Authentication middleware แทน
        const { message } = req.body;

        const result = await exports.sendLineNotification(userId, message || 'Test notification from Taskly');

        if (!result.success) {
            return res.status(400).json({ message: result.message || 'Failed to send notification' });
        }

        res.status(200).json({ message: 'Notification sent successfully' });
    } catch (error) {
        console.error('Error in test notification:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

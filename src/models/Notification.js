const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['task', 'assignment', 'course'] // ประเภทของการแจ้งเตือน
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
        // ไม่ต้องระบุ ref เพราะจะขึ้นอยู่กับ type
    },
    status: {
        type: String,
        enum: ['unread', 'read'],
        default: 'unread'
    },
    delivered: {
        line: { type: Boolean, default: false },
        web: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  itemType: {
    type: String,
    enum: ['task', 'assignment'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  // แทนที่ thresholdType และ thresholdValue ด้วยฟิลด์เดียว
  notificationType: {
    type: Number,
    required: true,
    enum: [0, 1, 2, 3],
    default: 0
  },
  delivered: {
    line: { type: Boolean, default: false },
    web: { type: Boolean, default: false }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Auto-delete after 30 days
  }
});

// Compound index for efficient querying
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
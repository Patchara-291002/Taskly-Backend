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
  contextType: {
    type: String,
    enum: ['project', 'course'],
    required: true
  },
  contextId: mongoose.Schema.Types.ObjectId,
  contextName: String,
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['unread', 'read'],
    default: 'unread'
  },
  thresholdType: {
    type: String,
    enum: ['hours', 'days'],
    required: true
  },
  thresholdValue: {
    type: Number,
    required: true
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
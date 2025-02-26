const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Status', required: true }, 
    taskName: { type: String, required: true },
    detail: { type: String },
    priority: { type: Number, default: 1 },
    roleId: { type: mongoose.Schema.Types.ObjectId }, 
    color: { type: String },
    startDate: { type: String },
    dueDate: { type: String },
    startTime: { type: String },
    dueTime: { type: String },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Task', taskSchema);

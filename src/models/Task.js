    const mongoose = require('mongoose');

    const taskSchema = new mongoose.Schema({
        statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Status' },
        taskName: { type: String, require: true },
        detail: { type: String },
        tag: { type: String },
        priority: { type: Number },
        color: { type: String },
        startDate: { type: String },
        dueDate: { type: String },
        statTime: { type: String },
        dueTime: { type: String,},
        assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    });

    module.exports = mongoose.model('Task', taskSchema);
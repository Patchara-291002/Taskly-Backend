const mongoose = require('mongoose');

const projectTaskSchema = new mongoose.Schema({
    taskName: { type: String, required: true },
    taskDescription: { type: String },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProjectTask', projectTaskSchema);
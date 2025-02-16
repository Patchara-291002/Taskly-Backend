const mongoose = require('mongoose');
const assignmentSchema = new mongoose.Schema(
    {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
        assignmentName: { type: String },
        description: { type: String },
        status: { type: String },
        startDate: { type: Date },
        endDate: { type: Date }, 
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
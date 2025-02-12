const mongoose = require('mongoose');
const courseSchema = new mongoose.Schema(
    {
        courseName: { type: String, required: true },
        courseCode: { type: String },
        courseColor: { type: String },
        instructorName: { type: String },
        location: { type: String },
        startTime: { type: Date },
        endTime: { type: Date },
        links: [
            {
                linkName: { type: String },
                linkAddress: { type: String },
            }
        ],
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

module.exports = mongoose.model('Course',courseSchema );
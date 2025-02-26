const mongoose = require('mongoose');
const courseSchema = new mongoose.Schema(
    {
        courseName: { type: String, required: true },
        courseCode: { type: String },
        courseColor: { type: String },
        courseType: { type: String, enum: ["default", "Math", "Languages"], default: "default"},
        instructorName: { type: String },
        location: { type: String },
        day: { type: String },
        startTime: { type: String },
        endTime: { type: String },
        contents: [
            {
              title: { type: String },
              content: { type: String },
              isLink: { type: Boolean, default: false }
            }
        ],
        files: [
            {
                fileName: { type: String },
                fileAddress: { type: String },
            }
        ],
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

module.exports = mongoose.model('Course',courseSchema );
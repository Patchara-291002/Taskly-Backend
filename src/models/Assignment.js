const mongoose = require('mongoose');
const assignmentSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    assignmentName: { type: String },
    description: { type: String },
    status: { 
      type: String,
      enum: ['Todo', 'Doing', 'Done'],
      default: 'Todo'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    links: [
      {
        linkName: { type: String },
        linkType: { 
        type: String,
        enum: ['link', 'file'],
        default: 'link'
        },
        linkAddress: { type: String },
      }
    ]
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
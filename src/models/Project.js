const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    users: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, required: true }
      }
    ],
    startDate: { type: String },
    dueDate: { type: String },
    percent: { type: Number },
    roles:[
      {
        roleId: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        name: { type: String, required: true },
        color: { type: String, required: true }
    }
    ],
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
  },
  {
    timestamps: { createdAt: 'createdAt', updateAt: 'updatedAt' }
  }
);

module.exports = mongoose.model('Project', projectSchema);

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    users: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: { createdAt: 'createdAt', updateAt: 'updatedAt' }
  }
);

module.exports = mongoose.model('Project', projectSchema);

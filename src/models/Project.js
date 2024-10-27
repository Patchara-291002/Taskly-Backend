const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
  projectName: { type: String, required: true },
  users: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ]
  },
  {
    timestamps: { createdAt: 'createdAt', updateAt: 'updatedAt' }
  }
);

module.exports = mongoose.model('Project', projectSchema);

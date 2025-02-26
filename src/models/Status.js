const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
    {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
        statusName: { type: String, required: true },
        color: { type: String },
        position: { type: Number, required: true },
        isDone: { type: Boolean, default: false }
    },
    {
        timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
    }
);

module.exports = mongoose.model('Status', statusSchema);

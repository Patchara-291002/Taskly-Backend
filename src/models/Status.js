const mongoose = require('mongoose')

const statusSchema = new mongoose.Schema(
    {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', require: true },
        statusName: { type: String, require: true },
        color: { type: String },
    },
    {
        timestamps: { createdAt: 'createAt', updatedAt: 'updateAt' }
    }
);

module.exports = mongoose.model('Status', statusSchema);
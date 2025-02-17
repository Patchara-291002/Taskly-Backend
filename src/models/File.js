const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
    {
        fileType: {
            type: String,
            require: true,
            enum: ['profile', 'icon', 'document', 'other']
        },
        fileUrl: {
            type: String,
            require: true
        },
        originName: {
            type: String
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        s3Key: {
            type: String
        },
    },
    {
        timestamps: true  
    }
)

module.exports = mongoose.model('File', fileSchema);
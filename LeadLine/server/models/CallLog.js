const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true
    },
    customerId: {
        type: String, // Using String ID to match Customer.id
        required: true,
        index: true
    },
    userId: {
        type: String, // Using String ID to match User.id
        required: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    attemptNumber: {
        type: mongoose.Schema.Types.Mixed, // Can be Number or String
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: [
            'Demo Scheduled',
            'Post Demo Followup',
            'Info Sent',
            'Follow up Needed',
            'Not Right Person',
            'Firm No',
            'Lost'
        ]
    },
    comments: {
        type: String,
        trim: true,
        default: ''
    },
    isDemo: {
        type: Boolean,
        default: false
    }
});

// Compound index for efficient querying
callLogSchema.index({ customerId: 1, date: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);

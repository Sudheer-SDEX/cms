const mongoose = require('mongoose');

const contactPersonSchema = new mongoose.Schema({
    name: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' }
}, { _id: false });

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: ['create', 'update', 'delete'],
        required: true
    },
    userId: {
        type: String, // Storing as String to match existing data format (ID reference)
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    details: { type: String }
}, { _id: false });

const customerSchema = new mongoose.Schema({
    // Explicit ID for backward compatibility with frontend that expects string IDs
    id: {
        type: String,
        unique: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    industry: {
        type: String,
        required: true,
        enum: ['Automobile', 'Healthcare', 'Manufacturing', 'Logistics', 'Education']
    },
    website: {
        type: String,
        trim: true,
        default: ''
    },
    customerPotential: {
        type: String,
        trim: true,
        default: ''
    },
    stage: {
        type: String,
        enum: ['In Progress', 'Demo Scheduled', 'Negotiation', 'Closed Won', 'Closed Lost', 'Deferred'],
        default: 'In Progress',
        index: true
    },
    additionalNotes: {
        type: String,
        trim: true,
        default: ''
    },
    contactPerson1: {
        type: contactPersonSchema,
        default: () => ({})
    },
    contactPerson2: {
        type: contactPersonSchema,
        default: () => ({})
    },
    contactPerson3: {
        type: contactPersonSchema,
        default: () => ({})
    },

    auditLog: [auditLogSchema],

    comments: [{
        userId: String,
        timestamp: Date,
        text: String
    }],

    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
customerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Customer', customerSchema);

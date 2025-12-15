const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false // Do not return password by default
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    // Keep the string ID for backward compatibility during migration if needed, 
    // but Mongoose uses _id by default. We'll try to map old IDs to _id or use a separate field.
    // For simplicity in migration, let's rely on _id, but we might need to handle the string IDs from db.json.
    // Let's add an explicit 'id' field to match the frontend's expectation of string IDs for now.
    id: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);

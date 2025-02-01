const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
// Loads the mongoose library which helps interact with MongoDB database

const userSchema = new mongoose.Schema({ 
    // Creates a template for how user data should be structured
    name: { 
        type: String, // The name must be text
        required: true // The name is required and can't be empty
    }, 
    email: { 
        type: String, // The email must be text
        required: true, // The email is required
        unique: true // Each email can only be used once
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    activities: {
        type: [{
            opportunityId: {
                type: String,
                required: true
            },
            title: {
                type: String,
                required: true
            },
            description: String,
            organization: {
                name: String,
                logo: String,
                description: String
            },
            url: String,  // Store the official volunteer connector URL
            remote_or_online: Boolean,
            dates: String,
            audience: {
                scope: String,
                regions: [String]
            },
            activities: [{
                name: String,
                category: String
            }],
            date: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: ['interested', 'applied', 'completed'],
                default: 'interested'
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }],
        validate: {
            validator: function(activities) {
                // Check for duplicate opportunityIds
                const ids = activities.map(a => a.opportunityId);
                return new Set(ids).size === ids.length;
            },
            message: 'Duplicate opportunities are not allowed'
        }
    }
}, { timestamps: true });

// Remove the previous index and add a new sparse unique compound index
userSchema.index({ 'activities.opportunityId': 1 }, { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { 'activities.opportunityId': { $exists: true } }
});

// Add password hashing before save
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Add method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 
// Makes this user template available to other parts of the application

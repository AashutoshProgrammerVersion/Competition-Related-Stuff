const mongoose = require('mongoose');
// Loads the mongoose library for database interactions

const opportunitySchema = new mongoose.Schema({
    // Creates a template for volunteer opportunity data
    title: { 
        type: String, // The title must be text
        required: true // Title is required
    },
    date: { 
        type: Date, // The date must be a valid date format
        required: true // Date is required
    }
});

module.exports = mongoose.model('Opportunity', opportunitySchema);
// Makes this opportunity template available to other parts of the application

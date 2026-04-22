// backend/models/Sale.js
const mongoose = require('mongoose');

// Define the Schema matching our ETL output
const saleSchema = new mongoose.Schema({
    'Order ID': {
        type: String,
        required: true,
        index: true // Indexing this makes searching by Order ID very fast
    },
    'Date': {
        type: Date,
        required: true
    },
    'Status': {
        type: String,
        required: true
    },
    'SKU': {
        type: String,
        required: true
    },
    'Category': {
        type: String,
        required: true
    },
    'Qty': {
        type: Number,
        required: true,
        min: [0, 'Quantity cannot be negative'] // Basic validation
    },
    'Amount': {
        type: Number,
        default: 0 // Handles missing amounts safely
    },
    'ship-city': {
        type: String,
        trim: true,
        uppercase: true // Enforces the uppercase rule from our ETL
    },
    // We store promotion-ids as an Array of Strings (since we transformed it)
    'promotion-ids': {
        type: [String],
        default: []
    }
}, {
    // This tells Mongoose to automatically add createdAt and updatedAt timestamps
    timestamps: true,
    // Specify the exact collection name we loaded data into during the ETL phase
    collection: 'sales_report' 
});

// Compile the schema into a model and export it
const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
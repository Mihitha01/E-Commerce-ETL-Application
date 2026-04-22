// backend/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Removed the deprecated options!
        const conn = await mongoose.connect('mongodb://localhost:27017/AmazonSalesDB');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); 
    }
};

module.exports = connectDB;
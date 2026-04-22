// backend/server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const redisClient = require('./redisClient'); // <-- NEW LINE ADDED HERE

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors()); 
app.use(express.json()); 

// A simple test route to ensure the server is running
app.get('/', (req, res) => {
    res.send('Amazon Sales API is running...');
});

// Import our Sales routes
app.use('/api/sales', require('./routes/salesRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
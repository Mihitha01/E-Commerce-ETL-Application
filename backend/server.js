// backend/server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors()); // Allows your frontend to make requests to this backend
app.use(express.json()); // Allows the backend to parse incoming JSON data

// A simple test route to ensure the server is running
app.get('/', (req, res) => {
    res.send('Amazon Sales API is running...');
});

// Import our Sales routes (we will create this file next)
app.use('/api/sales', require('./routes/salesRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
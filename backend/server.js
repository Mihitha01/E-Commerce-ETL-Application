// backend/server.js

const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const redisClient = require('./redisClient');
const { getDb } = require('./sqliteClient');

// Connect to MongoDB
connectDB();

// Initialize SQLite (creates tables if they don't exist)
getDb()
    .then(() => console.log('SQLite initialized successfully'))
    .catch((err) => console.warn('SQLite initialization skipped:', err.message));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        service: 'Amazon Sales ETL API',
        version: '2.0.0',
        endpoints: ['/api/sales', '/api/etl', '/api/redis'],
    });
});

// ── Route Registrations ──
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/etl', require('./routes/etlRoutes'));
app.use('/api/redis', require('./routes/redisRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api/sales`);
    console.log(`   ETL: http://localhost:${PORT}/api/etl/strategies`);
    console.log(`   Redis: http://localhost:${PORT}/api/redis\n`);
});
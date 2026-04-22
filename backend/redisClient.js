// backend/redisClient.js
const redis = require('redis');

// Create the Redis client pointing to your local Docker container
const redisClient = redis.createClient({
    url: 'redis://127.0.0.1:6379'
});

// Log any errors
redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
});

// Log successful connection
redisClient.on('connect', () => {
    console.log('Redis Connected: 127.0.0.1:6379');
});

// Initialize the connection
redisClient.connect();

module.exports = redisClient;
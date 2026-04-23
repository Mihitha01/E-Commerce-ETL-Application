// backend/routes/redisRoutes.js

const express = require('express');
const router = express.Router();
const redisClient = require('../redisClient');

/**
 * REDIS DEMO ROUTES
 * 
 * Covers PDF Day 4 requirements:
 * - get, set, delete with TTL
 * - Pub/Sub simulation
 * 
 * These routes demonstrate Redis as both a cache layer
 * and a message broker (Pub/Sub pattern).
 */

// @route   POST /api/redis/set
// @desc    Set a key-value pair with optional TTL
router.post('/set', async (req, res) => {
    try {
        const { key, value, ttl } = req.body;

        if (!key || value === undefined) {
            return res.status(400).json({ success: false, message: 'key and value are required' });
        }

        if (ttl && Number(ttl) > 0) {
            // EX = expiry in seconds
            await redisClient.set(key, JSON.stringify(value), { EX: Number(ttl) });
        } else {
            await redisClient.set(key, JSON.stringify(value));
        }

        res.json({ success: true, message: `Key "${key}" set successfully`, ttl: ttl || 'none' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   GET /api/redis/get/:key
// @desc    Get a cached value by key + remaining TTL
router.get('/get/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const value = await redisClient.get(key);
        const ttl = await redisClient.ttl(key); // -1 = no expiry, -2 = key doesn't exist

        if (value === null) {
            return res.status(404).json({ success: false, message: `Key "${key}" not found` });
        }

        res.json({
            success: true,
            data: { key, value: JSON.parse(value), remainingTTL: ttl },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   DELETE /api/redis/del/:key
// @desc    Delete a key from Redis
router.delete('/del/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const deleted = await redisClient.del(key);

        res.json({
            success: true,
            message: deleted ? `Key "${key}" deleted` : `Key "${key}" not found`,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   POST /api/redis/publish
// @desc    Publish a message to a Redis channel (Pub/Sub demo)
router.post('/publish', async (req, res) => {
    try {
        const { channel, message } = req.body;

        if (!channel || !message) {
            return res.status(400).json({ success: false, message: 'channel and message are required' });
        }

        // We need a separate client for publishing (redis requires it)
        const publishCount = await redisClient.publish(channel, JSON.stringify(message));

        res.json({
            success: true,
            message: `Published to "${channel}"`,
            subscriberCount: publishCount,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// @route   GET /api/redis/subscribe/:channel
// @desc    Subscribe to a channel via Server-Sent Events (SSE)
router.get('/subscribe/:channel', async (req, res) => {
    const { channel } = req.params;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'connected', channel })}\n\n`);

    // Create a duplicate client for subscribing (Redis requires separate connections)
    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    await subscriber.subscribe(channel, (message) => {
        res.write(`data: ${JSON.stringify({ type: 'message', channel, data: JSON.parse(message) })}\n\n`);
    });

    // Clean up when client disconnects
    req.on('close', async () => {
        await subscriber.unsubscribe(channel);
        await subscriber.disconnect();
        console.log(`[Redis] Client unsubscribed from "${channel}"`);
    });
});

module.exports = router;

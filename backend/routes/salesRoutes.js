// backend/routes/salesRoutes.js

const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const redisClient = require('../redisClient');

/**
 * REDIS CACHE MIDDLEWARE
 * 
 * Checks Redis before hitting MongoDB. If the data is cached, return it
 * immediately (saving ~50-200ms per request on large datasets).
 * Cache is invalidated on any write operation (POST/PUT/DELETE).
 */
const cacheMiddleware = (keyPrefix) => async (req, res, next) => {
    try {
        const cacheKey = `${keyPrefix}:${req.originalUrl}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            console.log(`[Cache HIT] ${cacheKey}`);
            return res.json(JSON.parse(cached));
        }

        console.log(`[Cache MISS] ${cacheKey}`);
        // Store the original res.json so we can intercept and cache the response
        res.originalJson = res.json.bind(res);
        res.json = (body) => {
            // Cache for 60 seconds
            redisClient.set(cacheKey, JSON.stringify(body), { EX: 60 }).catch(console.error);
            return res.originalJson(body);
        };
        next();
    } catch (err) {
        // If Redis is down, just skip caching — don't break the API
        console.warn('[Cache] Redis unavailable, skipping cache:', err.message);
        next();
    }
};

/**
 * Invalidate all sales-related cache entries
 */
const invalidateCache = async () => {
    try {
        const keys = [];
        for await (const key of redisClient.scanIterator({ MATCH: 'sales:*' })) {
            keys.push(key);
        }
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`[Cache] Invalidated ${keys.length} cached entries`);
        }
    } catch (err) {
        console.warn('[Cache] Failed to invalidate:', err.message);
    }
};

// ──────────────────────────────────────────────────
// READ OPERATIONS (with Redis caching)
// ──────────────────────────────────────────────────

// @route   GET /api/sales
// @desc    Get a paginated list of all sales (cached)
router.get('/', cacheMiddleware('sales'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Optional search filter
        const search = req.query.search;
        let filter = {};
        if (search) {
            filter = {
                $or: [
                    { 'Order ID': { $regex: search, $options: 'i' } },
                    { 'ship-city': { $regex: search, $options: 'i' } },
                    { 'Status': { $regex: search, $options: 'i' } },
                ]
            };
        }

        const sales = await Sale.find(filter).skip(skip).limit(limit);
        const total = await Sale.countDocuments(filter);

        res.json({
            success: true,
            count: sales.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: sales
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/sales/stats
// @desc    Aggregation: Total sales by City (cached)
router.get('/stats', cacheMiddleware('sales'), async (req, res) => {
    try {
        const stats = await Sale.aggregate([
            {
                $group: {
                    _id: '$ship-city',
                    totalSalesAmount: { $sum: '$Amount' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalSalesAmount: -1 } },
            { $limit: 10 }
        ]);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route   GET /api/sales/:id
// @desc    Get a single sale by ID
router.get('/:id', async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }
        res.json({ success: true, data: sale });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// ──────────────────────────────────────────────────
// WRITE OPERATIONS (invalidate cache after each)
// ──────────────────────────────────────────────────

// @route   POST /api/sales
// @desc    Create a new sale record
router.post('/', async (req, res) => {
    try {
        const sale = await Sale.create(req.body);
        await invalidateCache();
        res.status(201).json({ success: true, data: sale });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// @route   PUT /api/sales/:id
// @desc    Update an existing sale
router.put('/:id', async (req, res) => {
    try {
        const sale = await Sale.findByIdAndUpdate(req.params.id, req.body, {
            new: true,           // Return the updated document
            runValidators: true, // Run schema validators on update
        });

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        await invalidateCache();
        res.json({ success: true, data: sale });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
});

// @route   DELETE /api/sales/:id
// @desc    Delete a sale record
router.delete('/:id', async (req, res) => {
    try {
        const sale = await Sale.findByIdAndDelete(req.params.id);

        if (!sale) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        await invalidateCache();
        res.json({ success: true, message: 'Sale deleted', data: sale });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
// backend/routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');

// @route   GET /api/sales
// @desc    Get a paginated list of all sales
router.get('/', async (req, res) => {
    try {
        // Simple pagination: default to page 1, 50 items per page
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const sales = await Sale.find().skip(skip).limit(limit);
        const total = await Sale.countDocuments();

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
// @desc    Get aggregation query: Total sales amount by City
router.get('/stats', async (req, res) => {
    try {
        // Mongoose Aggregation Pipeline
        const stats = await Sale.aggregate([
            {
                // Group by the ship-city field
                $group: {
                    _id: '$ship-city', 
                    totalSalesAmount: { $sum: '$Amount' }, // Sum the Amount
                    orderCount: { $sum: 1 } // Count the number of orders
                }
            },
            {
                // Sort by total sales amount in descending order
                $sort: { totalSalesAmount: -1 }
            },
            {
                // Only take the top 10 cities
                $limit: 10
            }
        ]);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
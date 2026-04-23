// backend/routes/etlRoutes.js

const express = require('express');
const path = require('path');
const router = express.Router();

// Strategy classes
const CsvExtractor = require('../etl/extractors/CsvExtractor');
const NdjsonExtractor = require('../etl/extractors/NdjsonExtractor');
const ExcelExtractor = require('../etl/extractors/ExcelExtractor');
const SalesTransformer = require('../etl/transformers/SalesTransformer');
const MongoLoader = require('../etl/loaders/MongoLoader');
const PostgresLoader = require('../etl/loaders/PostgresLoader');
const ETLPipeline = require('../etl/ETLPipeline');

/**
 * Strategy Registry
 * Maps user-friendly names to concrete strategy classes.
 * Adding a new file format is as simple as adding one line here.
 */
const EXTRACTORS = {
    csv: () => new CsvExtractor({
        columns: ['Order ID', 'Date', 'Status', 'SKU', 'Category', 'Qty', 'Amount', 'ship-city', 'ship-state', 'promotion-ids']
    }),
    ndjson: () => new NdjsonExtractor(),
    excel: () => new ExcelExtractor(),
};

const LOADERS = {
    mongo: () => new MongoLoader(),
    postgres: () => new PostgresLoader(),
};

/**
 * @route   POST /api/etl/run
 * @desc    Trigger an ETL pipeline run with selected strategies
 * @body    { fileType: "csv"|"ndjson"|"excel", loaderType: "mongo"|"postgres", filePath: string }
 */
router.post('/run', async (req, res) => {
    try {
        const { fileType = 'csv', loaderType = 'mongo', filePath } = req.body;

        // Validate strategy selections
        if (!EXTRACTORS[fileType]) {
            return res.status(400).json({
                success: false,
                message: `Unknown file type: "${fileType}". Supported: ${Object.keys(EXTRACTORS).join(', ')}`,
            });
        }
        if (!LOADERS[loaderType]) {
            return res.status(400).json({
                success: false,
                message: `Unknown loader type: "${loaderType}". Supported: ${Object.keys(LOADERS).join(', ')}`,
            });
        }

        // Resolve file path — default to the Amazon Sales CSV
        const resolvedPath = filePath
            ? path.resolve(filePath)
            : path.resolve(__dirname, '../../etl/data/Amazon Sale Report.csv');

        // Build the pipeline with the selected strategies
        const pipeline = new ETLPipeline(
            EXTRACTORS[fileType](),
            new SalesTransformer(),
            LOADERS[loaderType]()
        );

        // Execute
        const summary = await pipeline.run(resolvedPath, {
            collection: 'sales_report',
            table: 'sales_report',
        });

        res.json({ success: true, data: summary });
    } catch (err) {
        console.error('[ETL Route Error]', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   GET /api/etl/strategies
 * @desc    List available extractor and loader strategies
 */
router.get('/strategies', (req, res) => {
    res.json({
        success: true,
        data: {
            extractors: Object.keys(EXTRACTORS),
            loaders: Object.keys(LOADERS),
        },
    });
});

module.exports = router;

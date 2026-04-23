// backend/etl/loaders/MongoLoader.js

const mongoose = require('mongoose');
const BaseLoader = require('./BaseLoader');

/**
 * MONGO LOADER — Concrete Strategy (NoSQL)
 * 
 * Uses the existing Mongoose connection (from db.js) to persist data.
 * Performs a bulk insertMany for performance.
 * 
 * WHY insertMany over individual inserts?
 * For 100K+ rows, individual inserts would make 100K round-trips to MongoDB.
 * insertMany sends them in a single batch, reducing network overhead by ~99%.
 */
class MongoLoader extends BaseLoader {
    /**
     * @param {string} connectionUri - MongoDB connection string
     */
    constructor(connectionUri = 'mongodb://127.0.0.1:27017/AmazonSalesDB') {
        super();
        this.connectionUri = connectionUri;
        this.connection = null;
    }

    async load(rows, options = {}) {
        const collectionName = options.collection || 'sales_report';
        const clearFirst = options.clearFirst !== false; // Default: clear collection before insert
        const startTime = Date.now();

        try {
            // Reuse existing mongoose connection if available, otherwise connect
            if (mongoose.connection.readyState !== 1) {
                this.connection = await mongoose.connect(this.connectionUri);
                console.log('[MongoLoader] Connected to MongoDB');
            }

            const db = mongoose.connection.db;
            const collection = db.collection(collectionName);

            // Optionally clear existing data (idempotent loads)
            if (clearFirst) {
                await collection.deleteMany({});
                console.log(`[MongoLoader] Cleared collection "${collectionName}"`);
            }

            // Batch insert
            let insertedCount = 0;
            if (rows.length > 0) {
                const result = await collection.insertMany(rows, { ordered: false });
                insertedCount = result.insertedCount;
            }

            const durationMs = Date.now() - startTime;
            console.log(
                `[MongoLoader] Inserted ${insertedCount} documents into "${collectionName}" in ${durationMs}ms`
            );

            return { insertedCount, durationMs };
        } catch (err) {
            throw new Error(`[MongoLoader] Load failed: ${err.message}`);
        }
    }

    async disconnect() {
        if (this.connection) {
            await mongoose.disconnect();
            console.log('[MongoLoader] Disconnected from MongoDB');
        }
    }
}

module.exports = MongoLoader;

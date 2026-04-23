// backend/etl/loaders/PostgresLoader.js

const { Client } = require('pg');
const BaseLoader = require('./BaseLoader');

/**
 * POSTGRES LOADER — Concrete Strategy (SQL)
 * 
 * WHY POSTGRES?
 * Demonstrates that the same ETL pipeline can target a relational database
 * without changing the Extract or Transform layers. This is the power of
 * the Strategy Pattern — the pipeline is database-agnostic.
 * 
 * Auto-creates the target table if it doesn't exist, using the column
 * names from the first row of data.
 */
class PostgresLoader extends BaseLoader {
    /**
     * @param {Object} connectionConfig - pg client config
     */
    constructor(connectionConfig = {}) {
        super();
        this.config = {
            host: connectionConfig.host || '127.0.0.1',
            port: connectionConfig.port || 5432,
            user: connectionConfig.user || 'postgres',
            password: connectionConfig.password || 'postgres',
            database: connectionConfig.database || 'etl_db',
        };
        this.client = null;
    }

    async load(rows, options = {}) {
        const tableName = options.table || 'sales_report';
        const clearFirst = options.clearFirst !== false;
        const startTime = Date.now();

        try {
            this.client = new Client(this.config);
            await this.client.connect();
            console.log('[PostgresLoader] Connected to PostgreSQL');

            // Auto-create table from data columns
            if (rows.length > 0) {
                await this._ensureTable(tableName, rows[0]);
            }

            // Optionally clear existing data
            if (clearFirst) {
                await this.client.query(`DELETE FROM "${tableName}"`);
                console.log(`[PostgresLoader] Cleared table "${tableName}"`);
            }

            // Batch insert using parameterized queries for SQL injection safety
            let insertedCount = 0;
            const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
            const quotedCols = columns.map(c => `"${c}"`).join(', ');

            for (const row of rows) {
                const values = columns.map(col => row[col]);
                const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

                await this.client.query(
                    `INSERT INTO "${tableName}" (${quotedCols}) VALUES (${placeholders})`,
                    values
                );
                insertedCount++;
            }

            const durationMs = Date.now() - startTime;
            console.log(
                `[PostgresLoader] Inserted ${insertedCount} rows into "${tableName}" in ${durationMs}ms`
            );

            return { insertedCount, durationMs };
        } catch (err) {
            throw new Error(`[PostgresLoader] Load failed: ${err.message}`);
        }
    }

    /**
     * Auto-create table if it doesn't exist.
     * Maps JS types to PostgreSQL column types.
     */
    async _ensureTable(tableName, sampleRow) {
        const columns = Object.entries(sampleRow).map(([key, value]) => {
            let pgType = 'TEXT'; // Default to TEXT — safe for any data
            if (typeof value === 'number') {
                pgType = Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
            } else if (typeof value === 'boolean') {
                pgType = 'BOOLEAN';
            } else if (value instanceof Date) {
                pgType = 'TIMESTAMP';
            } else if (Array.isArray(value)) {
                pgType = 'TEXT'; // Store arrays as JSON strings
            }
            return `"${key}" ${pgType}`;
        });

        const createSQL = `
            CREATE TABLE IF NOT EXISTS "${tableName}" (
                id SERIAL PRIMARY KEY,
                ${columns.join(',\n                ')}
            )
        `;

        await this.client.query(createSQL);
        console.log(`[PostgresLoader] Ensured table "${tableName}" exists`);
    }

    async disconnect() {
        if (this.client) {
            await this.client.end();
            console.log('[PostgresLoader] Disconnected from PostgreSQL');
        }
    }
}

module.exports = PostgresLoader;

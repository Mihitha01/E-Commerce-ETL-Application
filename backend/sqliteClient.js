// backend/sqliteClient.js

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

/**
 * SQLITE CLIENT — PDF Day 5 Requirement
 * 
 * WHY sql.js instead of better-sqlite3?
 * sql.js is a pure JavaScript (Emscripten-compiled) SQLite — zero native
 * build dependencies. No Visual Studio C++ toolchain required on Windows.
 * 
 * WHY SQLite alongside MongoDB?
 * The PDF requires demonstrating both SQL and NoSQL. SQLite is used here
 * for lightweight relational storage — specifically for ETL pipeline logs
 * and metadata that benefits from relational queries.
 */

const DB_PATH = path.join(__dirname, 'etl_pipeline.db');

let db = null;
let SQL = null;

async function getDb() {
    if (db) return db;

    SQL = await initSqlJs();

    // Load existing DB file if it exists, otherwise create new
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
    } else {
        db = new SQL.Database();
    }

    console.log(`[SQLite] Connected to ${DB_PATH}`);
    initTables();
    return db;
}

/**
 * Persist the in-memory DB to disk
 */
function saveDb() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    }
}

/**
 * Create tables for ETL pipeline logging
 */
function initTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS etl_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            loader_type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            extracted_count INTEGER DEFAULT 0,
            valid_count INTEGER DEFAULT 0,
            error_count INTEGER DEFAULT 0,
            duration_ms INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS etl_errors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER NOT NULL,
            row_index INTEGER,
            field TEXT,
            message TEXT,
            raw_data TEXT,
            FOREIGN KEY (run_id) REFERENCES etl_runs(id)
        )
    `);

    saveDb();
    console.log('[SQLite] Tables initialized');
}

/**
 * Log an ETL pipeline run
 */
function logRun(runData) {
    const stmt = db.prepare(`
        INSERT INTO etl_runs (file_path, file_type, loader_type, status, extracted_count, valid_count, error_count, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
        runData.filePath || '',
        runData.fileType || 'csv',
        runData.loaderType || 'mongo',
        runData.status || 'completed',
        runData.extractedCount || 0,
        runData.validCount || 0,
        runData.errorCount || 0,
        runData.durationMs || 0,
    ]);
    stmt.free();
    saveDb();

    // Get the last inserted row id
    const result = db.exec('SELECT last_insert_rowid() as id');
    return result[0]?.values[0]?.[0] || 0;
}

/**
 * Get recent ETL runs
 */
function getRecentRuns(limit = 20) {
    const results = db.exec(`SELECT * FROM etl_runs ORDER BY created_at DESC LIMIT ${limit}`);
    if (!results.length) return [];

    const columns = results[0].columns;
    return results[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
    });
}

/**
 * Log errors for a specific run
 */
function logErrors(runId, errors) {
    const stmt = db.prepare(`
        INSERT INTO etl_errors (run_id, row_index, field, message, raw_data)
        VALUES (?, ?, ?, ?, ?)
    `);

    for (const err of errors) {
        stmt.run([
            runId,
            err.rowIndex || 0,
            err.issues?.[0]?.field || 'unknown',
            err.issues?.[0]?.message || 'Unknown error',
            JSON.stringify(err.rawData || {}),
        ]);
    }
    stmt.free();
    saveDb();
}

module.exports = { getDb, logRun, getRecentRuns, logErrors };

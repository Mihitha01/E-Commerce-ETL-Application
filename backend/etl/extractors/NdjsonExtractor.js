// backend/etl/extractors/NdjsonExtractor.js

const fs = require('fs');
const readline = require('readline');
const BaseExtractor = require('./BaseExtractor');

/**
 * NDJSON EXTRACTOR — Concrete Strategy
 * 
 * Handles Newline-Delimited JSON (one JSON object per line).
 * Common in logging systems (e.g., CloudWatch, Datadog) and streaming APIs.
 * 
 * Gracefully handles malformed lines — logs the error and skips,
 * rather than crashing the entire pipeline.
 */
class NdjsonExtractor extends BaseExtractor {
    async extract(filePath) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(filePath)) {
                return reject(new Error(`NDJSON file not found: ${filePath}`));
            }

            const rows = [];
            const errors = [];
            let lineNumber = 0;

            const rl = readline.createInterface({
                input: fs.createReadStream(filePath),
                crlfDelay: Infinity, // Handle both \n and \r\n
            });

            rl.on('line', (line) => {
                lineNumber++;
                const trimmed = line.trim();

                // Skip empty lines
                if (!trimmed) return;

                try {
                    rows.push(JSON.parse(trimmed));
                } catch (err) {
                    // Log bad line but don't crash — graceful degradation
                    errors.push({
                        line: lineNumber,
                        content: trimmed.substring(0, 100), // Truncate for safety
                        error: err.message,
                    });
                }
            });

            rl.on('close', () => {
                if (errors.length > 0) {
                    console.warn(`[NdjsonExtractor] ${errors.length} malformed lines skipped.`);
                }
                console.log(`[NdjsonExtractor] Extracted ${rows.length} rows from ${filePath}`);
                resolve(rows);
            });

            rl.on('error', (err) => {
                reject(new Error(`[NdjsonExtractor] Read error: ${err.message}`));
            });
        });
    }

    static supportedExtensions() {
        return ['.ndjson', '.jsonl'];
    }
}

module.exports = NdjsonExtractor;

// backend/etl/extractors/CsvExtractor.js

const fs = require('fs');
const csv = require('csv-parser');
const BaseExtractor = require('./BaseExtractor');

/**
 * CSV EXTRACTOR — Concrete Strategy
 * 
 * Uses streaming (csv-parser) to handle large CSV files without loading
 * the entire file into memory. This is critical for enterprise datasets
 * like the 68MB Amazon Sales Report.
 */
class CsvExtractor extends BaseExtractor {
    /**
     * @param {Object} options
     * @param {string[]} [options.columns] - Specific columns to extract (optional)
     * @param {string} [options.separator] - Column delimiter (default: comma)
     */
    constructor(options = {}) {
        super();
        this.columns = options.columns || null;
        this.separator = options.separator || ',';
    }

    async extract(filePath) {
        return new Promise((resolve, reject) => {
            const rows = [];

            if (!fs.existsSync(filePath)) {
                return reject(new Error(`CSV file not found: ${filePath}`));
            }

            fs.createReadStream(filePath)
                .pipe(csv({ separator: this.separator }))
                .on('data', (row) => {
                    // If specific columns were requested, filter to only those
                    if (this.columns) {
                        const filtered = {};
                        this.columns.forEach(col => {
                            if (row[col] !== undefined) {
                                filtered[col] = row[col];
                            }
                        });
                        rows.push(filtered);
                    } else {
                        rows.push(row);
                    }
                })
                .on('end', () => {
                    console.log(`[CsvExtractor] Extracted ${rows.length} rows from ${filePath}`);
                    resolve(rows);
                })
                .on('error', (err) => {
                    reject(new Error(`[CsvExtractor] Stream error: ${err.message}`));
                });
        });
    }

    static supportedExtensions() {
        return ['.csv', '.tsv'];
    }
}

module.exports = CsvExtractor;

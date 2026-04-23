// backend/etl/extractors/ExcelExtractor.js

const XLSX = require('xlsx');
const BaseExtractor = require('./BaseExtractor');

/**
 * EXCEL EXTRACTOR — Concrete Strategy
 * 
 * Uses SheetJS (xlsx) to read .xlsx and .xls files.
 * Reads the first sheet by default, converts to JSON array.
 * 
 * WHY SheetJS?
 * It's the most widely used JS library for Excel parsing, has zero native
 * dependencies, and works in both Node.js and browser environments.
 */
class ExcelExtractor extends BaseExtractor {
    /**
     * @param {Object} options
     * @param {number} [options.sheetIndex] - Which sheet to read (0-indexed, default: 0)
     * @param {string} [options.sheetName] - Read a specific sheet by name (overrides sheetIndex)
     */
    constructor(options = {}) {
        super();
        this.sheetIndex = options.sheetIndex || 0;
        this.sheetName = options.sheetName || null;
    }

    async extract(filePath) {
        try {
            // Read the workbook (supports .xlsx, .xls, .ods)
            const workbook = XLSX.readFile(filePath);

            // Determine which sheet to read
            const targetSheet = this.sheetName
                ? this.sheetName
                : workbook.SheetNames[this.sheetIndex];

            if (!targetSheet || !workbook.Sheets[targetSheet]) {
                throw new Error(
                    `Sheet "${targetSheet || this.sheetIndex}" not found. ` +
                    `Available sheets: ${workbook.SheetNames.join(', ')}`
                );
            }

            // Convert sheet to array of row objects
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[targetSheet], {
                defval: '', // Default value for empty cells
            });

            console.log(`[ExcelExtractor] Extracted ${rows.length} rows from sheet "${targetSheet}"`);
            return rows;
        } catch (err) {
            throw new Error(`[ExcelExtractor] Failed to read ${filePath}: ${err.message}`);
        }
    }

    static supportedExtensions() {
        return ['.xlsx', '.xls', '.ods'];
    }
}

module.exports = ExcelExtractor;

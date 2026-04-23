// backend/etl/extractors/BaseExtractor.js

/**
 * BASE EXTRACTOR — Strategy Pattern Interface
 * 
 * WHY THIS PATTERN?
 * The Strategy Pattern lets us swap file-reading algorithms at runtime.
 * When a new file format appears (e.g., Parquet, XML), we simply add a new
 * class that extends BaseExtractor — zero changes to existing code (Open/Closed Principle).
 * 
 * Each concrete extractor MUST override the `extract()` method.
 */
class BaseExtractor {
    constructor() {
        if (new.target === BaseExtractor) {
            throw new Error(
                'BaseExtractor is abstract — instantiate a concrete extractor like CsvExtractor instead.'
            );
        }
    }

    /**
     * Extract raw data from a file.
     * @param {string} filePath - Absolute or relative path to the source file
     * @returns {Promise<Array<Object>>} - Array of row objects
     */
    async extract(filePath) {
        throw new Error(
            `extract() not implemented in ${this.constructor.name}. ` +
            'Every extractor must override this method.'
        );
    }

    /**
     * Returns the file extensions this extractor supports.
     * Used by the pipeline to auto-detect the correct strategy.
     */
    static supportedExtensions() {
        throw new Error('supportedExtensions() must be implemented by subclass.');
    }
}

module.exports = BaseExtractor;

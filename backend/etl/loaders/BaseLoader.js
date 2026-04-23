// backend/etl/loaders/BaseLoader.js

/**
 * BASE LOADER — Strategy Pattern Interface
 * 
 * WHY A LOADER STRATEGY?
 * The Tech Lead wants database-agnostic persistence. By abstracting the
 * Load step behind a common interface, we can swap between MongoDB,
 * PostgreSQL, or any future database without touching the pipeline logic.
 * 
 * This is the "L" in SOLID's Liskov Substitution Principle — any loader
 * can replace any other loader without breaking the pipeline.
 */
class BaseLoader {
    constructor() {
        if (new.target === BaseLoader) {
            throw new Error(
                'BaseLoader is abstract — instantiate a concrete loader like MongoLoader instead.'
            );
        }
    }

    /**
     * Load transformed data into the target database.
     * @param {Array<Object>} rows - Validated, transformed row objects
     * @param {Object} options - Loader-specific options (collection name, table name, etc.)
     * @returns {Promise<{ insertedCount: number, durationMs: number }>}
     */
    async load(rows, options = {}) {
        throw new Error(
            `load() not implemented in ${this.constructor.name}.`
        );
    }

    /**
     * Clean up connections when done.
     */
    async disconnect() {
        // Override in subclass if connection cleanup is needed
    }
}

module.exports = BaseLoader;

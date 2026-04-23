// backend/etl/transformers/BaseTransformer.js

/**
 * BASE TRANSFORMER — Strategy Pattern Interface
 * 
 * The Transform layer sits between Extract and Load. Its job is to:
 * 1. Validate each row against a schema
 * 2. Normalize data (type coercion, trimming, formatting)
 * 3. Gracefully handle bad rows (log + skip, don't crash)
 * 
 * Each concrete transformer defines its own Zod schema and
 * transformation rules for a specific data domain.
 */
class BaseTransformer {
    constructor() {
        if (new.target === BaseTransformer) {
            throw new Error(
                'BaseTransformer is abstract — instantiate a concrete transformer instead.'
            );
        }
    }

    /**
     * Transform and validate an array of raw row objects.
     * @param {Array<Object>} rawRows - Raw extracted data
     * @returns {Promise<{ validRows: Array, errors: Array, stats: Object }>}
     */
    async transform(rawRows) {
        throw new Error(
            `transform() not implemented in ${this.constructor.name}.`
        );
    }
}

module.exports = BaseTransformer;

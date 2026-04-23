// backend/etl/ETLPipeline.js

/**
 * ETL PIPELINE ORCHESTRATOR
 * 
 * This is the "Context" in the Strategy Pattern. It doesn't know HOW
 * data is extracted, transformed, or loaded — it just calls the interface
 * methods on whatever strategies are injected.
 * 
 * WHY DEPENDENCY INJECTION?
 * The pipeline receives its strategies via the constructor. This means:
 * 1. Unit testing: inject mock strategies
 * 2. Flexibility: swap CSV→NDJSON or Mongo→Postgres at runtime
 * 3. Single Responsibility: Pipeline only orchestrates, never implements
 */
class ETLPipeline {
    /**
     * @param {BaseExtractor} extractor - The extraction strategy
     * @param {BaseTransformer} transformer - The transformation strategy
     * @param {BaseLoader} loader - The loading strategy
     */
    constructor(extractor, transformer, loader) {
        this.extractor = extractor;
        this.transformer = transformer;
        this.loader = loader;
    }

    /**
     * Execute the full ETL pipeline.
     * @param {string} filePath - Path to the source data file
     * @param {Object} loadOptions - Options passed to the loader (collection/table name, etc.)
     * @returns {Promise<Object>} Pipeline execution summary
     */
    async run(filePath, loadOptions = {}) {
        const pipelineStart = Date.now();
        const summary = {
            filePath,
            status: 'pending',
            extract: null,
            transform: null,
            load: null,
            errors: [],
            durationMs: 0,
        };

        try {
            // ── STEP 1: EXTRACT ──
            console.log('\n═══ ETL PIPELINE: EXTRACT ═══');
            const rawRows = await this.extractor.extract(filePath);
            summary.extract = {
                rowCount: rawRows.length,
                status: 'success',
            };

            // ── STEP 2: TRANSFORM ──
            console.log('\n═══ ETL PIPELINE: TRANSFORM ═══');
            const { validRows, errors, stats } = await this.transformer.transform(rawRows);
            summary.transform = {
                ...stats,
                status: 'success',
            };
            summary.errors = errors;

            // ── STEP 3: LOAD ──
            console.log('\n═══ ETL PIPELINE: LOAD ═══');
            const loadResult = await this.loader.load(validRows, loadOptions);
            summary.load = {
                ...loadResult,
                status: 'success',
            };

            summary.status = 'completed';
        } catch (err) {
            summary.status = 'failed';
            summary.errors.push({
                stage: 'pipeline',
                message: err.message,
            });
            console.error(`[ETLPipeline] FAILED: ${err.message}`);
        } finally {
            summary.durationMs = Date.now() - pipelineStart;
            console.log(`\n═══ ETL PIPELINE: ${summary.status.toUpperCase()} (${summary.durationMs}ms) ═══\n`);
        }

        return summary;
    }
}

module.exports = ETLPipeline;

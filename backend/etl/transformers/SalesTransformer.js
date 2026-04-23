// backend/etl/transformers/SalesTransformer.js

const { z } = require('zod');
const BaseTransformer = require('./BaseTransformer');

/**
 * SALES TRANSFORMER — Concrete Strategy
 * 
 * WHY ZOD?
 * Zod provides runtime type-checking with excellent error messages.
 * Unlike Joi, Zod is TypeScript-first and has a smaller bundle.
 * Each field gets explicit validation rules the Tech Lead can audit.
 * 
 * GRACEFUL ERROR HANDLING:
 * Bad rows are captured in an errors array with the row index and
 * Zod's detailed error messages. The pipeline continues processing
 * all remaining rows — one bad record doesn't kill the batch.
 */

// Define the validation schema for a sales record
const SalesRowSchema = z.object({
    'Order ID': z.string().min(1, 'Order ID is required'),
    'Date': z.string().min(1, 'Date is required'),
    'Status': z.string().min(1, 'Status is required'),
    'SKU': z.string().optional().default(''),
    'Category': z.string().optional().default('Uncategorized'),
    'Qty': z.preprocess(
        // Coerce string → number, handle empty/NaN
        (val) => {
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        },
        z.number().min(0, 'Quantity cannot be negative')
    ),
    'Amount': z.preprocess(
        (val) => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        },
        z.number().min(0, 'Amount cannot be negative')
    ),
    'ship-city': z.string().optional().default(''),
    'ship-state': z.string().optional().default(''),
    'promotion-ids': z.string().optional().default(''),
});

class SalesTransformer extends BaseTransformer {
    async transform(rawRows) {
        const validRows = [];
        const errors = [];
        const startTime = Date.now();

        for (let i = 0; i < rawRows.length; i++) {
            const result = SalesRowSchema.safeParse(rawRows[i]);

            if (result.success) {
                // Apply business transformations AFTER validation
                const row = result.data;

                // Normalize: uppercase city names (business rule from Phase 1)
                row['ship-city'] = row['ship-city'].toUpperCase().trim();

                // Normalize: parse date to ISO format
                const parsedDate = new Date(row['Date']);
                row['Date'] = isNaN(parsedDate.getTime())
                    ? null  // Will be caught if Date is required downstream
                    : parsedDate.toISOString();

                // Normalize: split promotion-ids into array
                row['promotion-ids'] = row['promotion-ids']
                    ? row['promotion-ids'].split(',').map(id => id.trim()).filter(Boolean)
                    : [];

                validRows.push(row);
            } else {
                // Log the bad row with details — don't crash the pipeline
                errors.push({
                    rowIndex: i,
                    rawData: rawRows[i],
                    issues: result.error.issues.map(issue => ({
                        field: issue.path.join('.'),
                        message: issue.message,
                        code: issue.code,
                    })),
                });
            }
        }

        const stats = {
            totalInput: rawRows.length,
            validCount: validRows.length,
            errorCount: errors.length,
            successRate: ((validRows.length / rawRows.length) * 100).toFixed(1) + '%',
            durationMs: Date.now() - startTime,
        };

        console.log(
            `[SalesTransformer] ${stats.validCount}/${stats.totalInput} rows valid ` +
            `(${stats.successRate}) in ${stats.durationMs}ms`
        );

        return { validRows, errors, stats };
    }
}

module.exports = SalesTransformer;

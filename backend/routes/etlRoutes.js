const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const router = express.Router();

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ETL_ROOT = path.join(PROJECT_ROOT, 'etl');
const ETL_MAIN = path.join(ETL_ROOT, 'main.py');

const WINDOWS_VENV_PYTHON = path.join(ETL_ROOT, '.venv', 'Scripts', 'python.exe');
const UNIX_VENV_PYTHON = path.join(ETL_ROOT, '.venv', 'bin', 'python');
const PYTHON_EXECUTABLE = fs.existsSync(WINDOWS_VENV_PYTHON)
    ? WINDOWS_VENV_PYTHON
    : fs.existsSync(UNIX_VENV_PYTHON)
        ? UNIX_VENV_PYTHON
        : 'python';

/**
 * Public strategy names exposed to the frontend.
 * "postgres" is mapped to the Python SQL loader for backward compatibility.
 */
const EXTRACTORS = ['csv', 'ndjson', 'excel'];
const LOADERS = ['mongo', 'postgres'];

function normalizeLoader(loaderType) {
    return loaderType === 'postgres' ? 'sql' : loaderType;
}

function buildPythonArgs({ fileType, loaderType, filePath }) {
    const normalizedLoader = normalizeLoader(loaderType);
    const args = [
        ETL_MAIN,
        '--output-json',
        '--file-path', filePath,
        '--extractor', fileType,
        '--loader', normalizedLoader,
    ];

    if (normalizedLoader === 'mongo') {
        args.push('--mongo-uri', process.env.MONGO_URI || 'mongodb://localhost:27017/');
        args.push('--mongo-db', process.env.MONGO_DB_NAME || 'AmazonSalesDB');
        args.push('--mongo-collection', process.env.MONGO_COLLECTION || 'sales_report');
    } else {
        args.push('--sql-connection-string', process.env.ETL_SQL_CONNECTION_STRING || 'sqlite:///etl_pipeline.db');
        args.push('--sql-table', process.env.ETL_SQL_TABLE || 'sales_report');
    }

    return args;
}

function extractJsonFromStdout(stdout) {
    const lines = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    for (let i = lines.length - 1; i >= 0; i -= 1) {
        const line = lines[i];
        if (line.startsWith('{') && line.endsWith('}')) {
            return JSON.parse(line);
        }
    }

    throw new Error('Could not parse JSON output from Python ETL');
}

function runPythonPipeline({ fileType, loaderType, filePath }) {
    return new Promise((resolve, reject) => {
        const args = buildPythonArgs({ fileType, loaderType, filePath });
        const child = spawn(PYTHON_EXECUTABLE, args, { cwd: ETL_ROOT });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (error) => {
            reject(new Error(`Failed to start Python ETL: ${error.message}`));
        });

        child.on('close', (code) => {
            try {
                const summary = extractJsonFromStdout(stdout);
                // Keep response-compatible behavior: return summary even when pipeline failed.
                // The frontend reads summary.status to render completed vs failed.
                resolve(summary);
            } catch (parseError) {
                const message =
                    stderr.trim() ||
                    `Python ETL exited with code ${code}: ${parseError.message}`;
                reject(new Error(message));
            }
        });
    });
}

/**
 * @route   POST /api/etl/run
 * @desc    Trigger an ETL pipeline run with selected strategies
 * @body    { fileType: "csv"|"ndjson"|"excel", loaderType: "mongo"|"postgres", filePath: string }
 */
router.post('/run', async (req, res) => {
    try {
        const { fileType = 'csv', loaderType = 'mongo', filePath } = req.body;

        // Validate strategy selections
        if (!EXTRACTORS.includes(fileType)) {
            return res.status(400).json({
                success: false,
                message: `Unknown file type: "${fileType}". Supported: ${EXTRACTORS.join(', ')}`,
            });
        }
        if (!LOADERS.includes(loaderType)) {
            return res.status(400).json({
                success: false,
                message: `Unknown loader type: "${loaderType}". Supported: ${LOADERS.join(', ')}`,
            });
        }

        // Resolve file path — default to the Amazon Sales CSV in the etl folder
        const resolvedPath = filePath
            ? path.resolve(filePath)
            : path.resolve(ETL_ROOT, 'data/Amazon Sale Report.csv');

        const summary = await runPythonPipeline({
            fileType,
            loaderType,
            filePath: resolvedPath,
        });

        res.json({ success: true, data: summary });
    } catch (err) {
        console.error('[ETL Route Error]', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

/**
 * @route   GET /api/etl/strategies
 * @desc    List available extractor and loader strategies
 */
router.get('/strategies', (req, res) => {
    res.json({
        success: true,
        data: {
            extractors: EXTRACTORS,
            loaders: LOADERS,
        },
    });
});

module.exports = router;

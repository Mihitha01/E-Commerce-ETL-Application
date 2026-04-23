import { useState, useRef, useCallback } from 'react';
import { useHookstate } from '@hookstate/core';
import { authState } from '../store/authStore';
import ToastNotification from '../components/ToastNotification';
import type { ToastHandle } from '../components/ToastNotification';

/**
 * ETL PIPELINE CONTROL PANEL
 * 
 * Allows users to trigger ETL pipeline runs from the UI,
 * selecting the file type (extractor strategy) and target
 * database (loader strategy). Shows results including
 * valid/error row counts and duration.
 */

interface PipelineResult {
  status: string;
  extract: { rowCount: number } | null;
  transform: { totalInput: number; validCount: number; errorCount: number; successRate: string; durationMs: number } | null;
  load: { insertedCount: number; durationMs: number } | null;
  errors: Array<{ rowIndex?: number; issues?: Array<{ field: string; message: string }> }>;
  durationMs: number;
}

const ETLPanel = () => {
  const auth = useHookstate(authState);
  const toastRef = useRef<ToastHandle>(null);

  const [fileType, setFileType] = useState('csv');
  const [loaderType, setLoaderType] = useState('mongo');
  const [filePath, setFilePath] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);

  const runPipeline = useCallback(async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const baseUrl = auth.apiBaseUrl.get();
      const response = await fetch(`${baseUrl}/api/etl/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType,
          loaderType,
          filePath: filePath || undefined,
        }),
      });

      const json = await response.json();

      if (json.success) {
        setResult(json.data);
        toastRef.current?.showToast(
          `Pipeline ${json.data.status}: ${json.data.transform?.validCount || 0} rows loaded`,
          json.data.status === 'completed' ? 'success' : 'error'
        );
      } else {
        toastRef.current?.showToast(json.message || 'Pipeline failed', 'error');
      }
    } catch (err) {
      toastRef.current?.showToast('Failed to connect to ETL API', 'error');
    } finally {
      setIsRunning(false);
    }
  }, [fileType, loaderType, filePath]);

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <ToastNotification ref={toastRef} />

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 
            flex items-center justify-center text-sm font-bold text-white shadow-lg">E</div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">ETL Pipeline Control</h1>
            <p className="text-xs text-slate-400">Strategy Pattern — Extract → Transform → Load</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Configuration Card */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Pipeline Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Extractor selector */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Extract Strategy</label>
              <select
                id="extractor-select"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="csv">📄 CSV Extractor</option>
                <option value="ndjson">📋 NDJSON Extractor</option>
                <option value="excel">📊 Excel Extractor</option>
              </select>
            </div>

            {/* Loader selector */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Load Strategy</label>
              <select
                id="loader-select"
                value={loaderType}
                onChange={(e) => setLoaderType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800
                  focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="mongo">🍃 MongoDB (NoSQL)</option>
                <option value="postgres">🐘 PostgreSQL (SQL)</option>
              </select>
            </div>

            {/* File path */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">File Path (optional)</label>
              <input
                id="file-path-input"
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                placeholder="Default: Amazon Sale Report.csv"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800
                  placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          <button
            id="run-pipeline-btn"
            onClick={runPipeline}
            disabled={isRunning}
            className="mt-6 w-full md:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 
              text-white font-semibold text-sm tracking-wide shadow-lg shadow-indigo-500/25
              hover:shadow-xl hover:from-indigo-500 hover:to-purple-500
              active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running Pipeline...
              </span>
            ) : '▶ Run ETL Pipeline'}
          </button>
        </div>

        {/* Results Card */}
        {result && (
          <div className="glass-card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-slate-800">Pipeline Results</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${result.status === 'completed' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-rose-100 text-rose-700'}`}>
                {result.status}
              </span>
            </div>

            {/* Stage summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Extract */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Extract</p>
                <p className="text-2xl font-bold text-slate-800">{result.extract?.rowCount?.toLocaleString() || '—'}</p>
                <p className="text-xs text-slate-500">rows extracted</p>
              </div>
              {/* Transform */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Transform</p>
                <p className="text-2xl font-bold text-emerald-600">{result.transform?.validCount?.toLocaleString() || '—'}</p>
                <p className="text-xs text-slate-500">
                  valid · {result.transform?.errorCount || 0} errors · {result.transform?.successRate || '—'}
                </p>
              </div>
              {/* Load */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Load</p>
                <p className="text-2xl font-bold text-indigo-600">{result.load?.insertedCount?.toLocaleString() || '—'}</p>
                <p className="text-xs text-slate-500">documents inserted · {result.durationMs}ms total</p>
              </div>
            </div>

            {/* Errors (if any) */}
            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-rose-600 mb-3">
                  Validation Errors ({Math.min(result.errors.length, 10)} of {result.errors.length} shown)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="p-3 rounded-lg bg-rose-50 border border-rose-200/60 text-xs">
                      <span className="font-mono font-bold text-rose-700">Row {err.rowIndex}: </span>
                      <span className="text-rose-600">
                        {err.issues?.map(iss => `${iss.field}: ${iss.message}`).join(', ') || 'Unknown error'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Architecture Info */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-base font-semibold text-slate-800 mb-3">Architecture: Strategy Pattern</h2>
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              <span className="font-semibold text-indigo-600">Extract</span> — 
              Swappable file parsers (CSV, NDJSON, Excel) via <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono">BaseExtractor</code>
            </p>
            <p>
              <span className="font-semibold text-emerald-600">Transform</span> — 
              Zod schema validation with graceful per-row error handling via <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono">SalesTransformer</code>
            </p>
            <p>
              <span className="font-semibold text-purple-600">Load</span> — 
              Database-agnostic persistence (MongoDB or PostgreSQL) via <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs font-mono">BaseLoader</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ETLPanel;

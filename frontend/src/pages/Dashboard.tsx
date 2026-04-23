import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHookstate } from '@hookstate/core';
import { authState, logoutUser } from '../store/authStore';
import KpiCard from '../components/KpiCard';
import ToastNotification from '../components/ToastNotification';
import type { ToastHandle } from '../components/ToastNotification';

/**
 * ENTERPRISE DASHBOARD
 * 
 * Demonstrates ALL PDF Day 1 hooks:
 * - useState: local state for sales, loading, search, pagination
 * - useRef: search input focus, toast imperative handle
 * - useEffect: data fetching on mount
 * - useCallback: memoized fetch function
 * - useMemo: derived KPI calculations + filtered data
 * - useHookstate: global auth state
 */

interface Sale {
  _id: string;
  'Order ID': string;
  Date: string;
  Status: string;
  Amount: number;
  Category: string;
  'ship-city': string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const auth = useHookstate(authState);

  // ── useState ──
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // ── useRef ──
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<ToastHandle>(null);

  // ── useCallback: Memoized fetch to prevent recreation on every render ──
  const fetchSalesData = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const baseUrl = auth.apiBaseUrl.get();
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const response = await fetch(`${baseUrl}/api/sales?page=${page}&limit=15${searchParam}`);
      const json = await response.json();

      if (json.success) {
        setSales(json.data);
        setTotalPages(json.totalPages);
        setTotalRecords(json.total);
        setCurrentPage(json.page);
        toastRef.current?.showToast(`Loaded ${json.count} of ${json.total} records`, 'success');
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      console.error('Backend fetch error:', err);
      setError('Error connecting to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // ── useEffect: Fetch data on mount and when page changes ──
  useEffect(() => {
    fetchSalesData(currentPage);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [fetchSalesData, currentPage]);

  // ── useMemo: Derived KPI calculations ──
  const filteredSales = useMemo(() => {
    return sales.filter(sale =>
      sale['ship-city']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale['Order ID']?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + (sale.Amount || 0), 0);
  }, [filteredSales]);

  const avgOrderValue = useMemo(() => {
    return filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  }, [totalRevenue, filteredSales]);

  const uniqueCities = useMemo(() => {
    return new Set(filteredSales.map(s => s['ship-city']).filter(Boolean)).size;
  }, [filteredSales]);

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  // Status badge color logic
  const getStatusStyle = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'cancelled') return 'bg-rose-100 text-rose-700';
    if (s === 'shipped' || s === 'delivered to buyer') return 'bg-emerald-100 text-emerald-700';
    if (s === 'pending') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <ToastNotification ref={toastRef} />

      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 
              flex items-center justify-center text-sm font-bold text-white shadow-lg">E</div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">ETL Command Center</h1>
              <p className="text-xs text-slate-400">Live data pipeline</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Connected</span>
            </div>
            <span className="text-sm font-medium text-indigo-600">
              {auth.user.get()}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium
                hover:bg-slate-200 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <KpiCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            icon="💰"
            trend="12.5%"
            trendUp={true}
            color="indigo"
          />
          <KpiCard
            title="Orders Shown"
            value={filteredSales.length.toString()}
            icon="📦"
            trend={`${totalRecords} total`}
            trendUp={true}
            color="emerald"
          />
          <KpiCard
            title="Avg Order Value"
            value={`₹${avgOrderValue.toFixed(2)}`}
            icon="📈"
            color="amber"
          />
          <KpiCard
            title="Cities Covered"
            value={uniqueCities.toString()}
            icon="🏙️"
            color="rose"
          />
        </div>

        {/* Search + Controls */}
        <div className="glass-card p-4 mb-6 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[250px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              ref={searchInputRef}
              id="search-input"
              type="text"
              placeholder="Search by City or Order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-800
                placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 
                focus:border-indigo-400 transition-all duration-200"
            />
          </div>
          <button
            onClick={() => fetchSalesData(1)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
              hover:bg-indigo-700 active:scale-[0.97] transition-all duration-200 shadow-sm"
          >
            Refresh
          </button>
        </div>

        {/* Data Table */}
        <div className="glass-card overflow-hidden animate-fade-in">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-3 text-slate-500">
                <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-medium">Loading from MongoDB...</span>
              </div>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-rose-500 font-semibold">{error}</p>
              <button onClick={() => fetchSalesData(1)} className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/60">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.map((sale, idx) => (
                      <tr
                        key={sale._id}
                        className="hover:bg-indigo-50/40 transition-colors duration-150"
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <td className="px-5 py-3.5 text-sm font-mono font-medium text-slate-800">
                          {sale['Order ID']}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">
                          {new Date(sale.Date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusStyle(sale.Status)}`}>
                            {sale.Status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{sale['ship-city']}</td>
                        <td className="px-5 py-3.5 text-sm text-right font-semibold text-slate-800">
                          ₹{(sale.Amount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-5 py-3.5 border-t border-slate-200/60 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages} · {totalRecords.toLocaleString()} total records
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600
                      hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600
                      hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
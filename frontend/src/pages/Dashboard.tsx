import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHookstate } from '@hookstate/core';
import { authState } from '../store/authStore';
import KpiCard from '../components/KpiCard'; 
import ToastNotification from '../components/ToastNotification';
import type { ToastHandle } from '../components/ToastNotification';

interface Sale {
  _id: string;
  'Order ID': string;
  Date: string;
  Status: string;
  Amount: number;
  'ship-city': string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Grab our global auth state!
  const auth = useHookstate(authState);

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const toastRef = useRef<ToastHandle>(null);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${baseUrl}/api/sales?limit=10`);
      const json = await response.json();
      if (json.success) {
        setSales(json.data);
        // NEW: Press the button on our remote control!
        toastRef.current?.showToast('Live data loaded from MongoDB!');
      }
      else setError('Failed to fetch data');
    } catch (err) {
      console.error("Backend fetch error:", err); // We are now using the 'err' variable!
      setError('Error connecting to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSalesData();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [fetchSalesData]);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => 
      sale['ship-city']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale['Order ID']?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sales, searchTerm]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + (sale.Amount || 0), 0);
  }, [filteredSales]);

  const handleLogout = () => {
    sessionStorage.clear();
    // Clear the global state
    auth.isAuthenticated.set(false);
    auth.user.set(null);
    navigate('/');
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <ToastNotification ref={toastRef} />
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Amazon ETL Dashboard</h1>
          <p className="text-gray-500 mt-1">Live data from MongoDB</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Read the global state value here using .get() */}
          <span className="font-semibold text-blue-600">Welcome, {auth.user.get()}</span>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600 transition">
            Logout
          </button>
        </div>
      </div>

      <KpiCard title="Total Revenue (Filtered Orders)" value={totalRevenue} />

      <div className="mb-6">
        <input 
          ref={searchInputRef}
          type="text" 
          placeholder="Search by City or Order ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-1/3 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading data from backend...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-bold">{error}</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.map((sale) => (
                <tr key={sale._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale['Order ID']}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sale.Date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.Status === 'Cancelled' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {sale.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale['ship-city']}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">₹{sale.Amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
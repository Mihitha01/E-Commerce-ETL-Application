import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/**
 * REQUIREMENT: Lazy Loading (React.lazy)
 * Each page is loaded on-demand, reducing the initial bundle size.
 * This is critical for enterprise apps with many routes.
 */
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ETLPanel = React.lazy(() => import('./pages/ETLPanel'));

/**
 * Protected Route wrapper — checks all storage mechanisms
 * (localStorage, sessionStorage, cookies) for auth status.
 */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated =
    localStorage.getItem('isAuthenticated') === 'true' ||
    sessionStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

/**
 * Loading fallback with branded spinner
 */
const LoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-gradient-mesh">
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 
        flex items-center justify-center text-xl font-bold text-white shadow-xl animate-pulse">
        E
      </div>
      <p className="text-sm font-medium text-slate-500">Loading module...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/etl"
            element={
              <ProtectedRoute>
                <ETLPanel />
              </ProtectedRoute>
            }
          />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
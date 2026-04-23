import React, { useState } from 'react';
import hash from 'object-hash';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../store/authStore';

/**
 * ENTERPRISE LOGIN PAGE
 * 
 * Demonstrates:
 * - object-hash for credential verification (PDF Day 2)
 * - localStorage, sessionStorage, cookies (PDF Day 2) — via loginUser()
 * - useHookstate for global state (PDF Day 1)
 * - Glassmorphism UI with animated gradient background
 */
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for premium feel
    await new Promise(r => setTimeout(r, 600));

    const targetHash = hash({ user: 'admin', pass: 'password123' });
    const inputHash = hash({ user: username, pass: password });

    if (inputHash === targetHash) {
      // loginUser() handles: hookstate merge + localStorage + sessionStorage + cookies
      loginUser(username, 'admin');
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Use admin / password123');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md animate-slide-up">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 
            flex items-center justify-center text-2xl font-bold text-white shadow-xl mb-4">
            E
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ETL Command Center</h1>
          <p className="text-slate-400 mt-2 text-sm">Enterprise Data Pipeline Management</p>
        </div>

        {/* Glass card form */}
        <form
          onSubmit={handleLogin}
          className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.1] rounded-2xl p-8 shadow-2xl"
        >
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white 
                placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                focus:border-indigo-500/50 transition-all duration-200"
              autoComplete="username"
            />
          </div>

          <div className="mb-7">
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white 
                placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                focus:border-indigo-500/50 transition-all duration-200"
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white 
              font-semibold text-sm tracking-wide shadow-lg shadow-indigo-500/25
              hover:shadow-xl hover:shadow-indigo-500/30 hover:from-indigo-500 hover:to-purple-500
              active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Authenticating...
              </span>
            ) : (
              'Sign In'
            )}
          </button>

          <p className="mt-5 text-center text-xs text-slate-500">
            Demo credentials: <span className="text-slate-400 font-mono">admin</span> / <span className="text-slate-400 font-mono">password123</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
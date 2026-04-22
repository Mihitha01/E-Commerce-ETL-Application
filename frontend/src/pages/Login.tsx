import React, { useState } from 'react';
import hash from 'object-hash';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Hardcoded target hash (In reality, this would be on a server)
    // We are hashing the object { user: 'admin', pass: 'password123' }
    const targetHash = hash({ user: 'admin', pass: 'password123' });
    
    // 2. Hash the user's input
    const inputHash = hash({ user: username, pass: password });

    // 3. Compare hashes
    if (inputHash === targetHash) {
      // Supervisor Requirement: Save login session
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('user', username);
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Hint: use admin / password123');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">ETL Login</h2>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
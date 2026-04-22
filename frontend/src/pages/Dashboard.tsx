import React from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const user = sessionStorage.getItem('user');

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Amazon Sales Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Welcome, {user}</span>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600">
            Logout
          </button>
        </div>
      </div>
      <p>Data tables and charts will go here!</p>
    </div>
  );
};

export default Dashboard;
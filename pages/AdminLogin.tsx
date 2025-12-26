
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Server } from '../components/Icons';
import { useApp } from '../App';
import { authenticateUser } from '../services/db';
import { SEO } from '../components/SEO';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await authenticateUser(email, password);
    if (user && user.role === 'admin') {
      login(user);
      navigate('/admin');
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <SEO title="Admin Login" />
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 text-white">
            <Server size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-slate-500 text-sm">Secure access for store owners</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
            <Lock size={18} /> Authenticate
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100">
           <div className="bg-slate-50 p-4 rounded-lg text-center">
             <p className="text-xs text-slate-500 font-medium mb-1">Access Credentials</p>
             <div className="text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-200">
               ID: gyanforindia7@gmail.com<br/>
               Pass: Jaimatadi@16@
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;
import { AdminLayout } from '../components/AdminLayout';
import { getProducts, getQuotes, getOrders, formatCurrency, clearAllCache } from '../services/db';
import { SEO } from '../components/SEO';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, ExternalLink, HelpCircle, Terminal, Trash2, RefreshCcw } from '../components/Icons';
import { useApp } from '../App';

export const AdminDashboard: React.FC = () => {
  const { refreshGlobalData } = useApp();
  const [productsCount, setProductsCount] = useState(0);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const loadDashboardData = async () => {
    const allProducts = await getProducts();
    setProductsCount(allProducts.length);
    
    const allQuotes = await getQuotes();
    setQuotes(allQuotes || []);
    
    const allOrders = await getOrders();
    setOrders(allOrders || []);
    
    const revenue = (allOrders || []).reduce((sum, order) => sum + order.total, 0);
    setTotalRevenue(revenue);
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const data = last7Days.map(dateStr => {
       const dateObj = new Date(dateStr);
       const name = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
       const quotesCount = (allQuotes || []).filter(q => q.date && q.date.startsWith(dateStr)).length;
       const ordersCount = (allOrders || []).filter(o => o.date && o.date.startsWith(dateStr)).length;
       
       return {
           name,
           quotes: quotesCount,
           orders: ordersCount
       };
    });
    setChartData(data);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleClearCache = async () => {
      if (window.confirm('This will wipe all locally stored cache and force a re-sync with the database. Continue?')) {
          setIsClearing(true);
          clearAllCache();
          await refreshGlobalData();
          setTimeout(() => {
              setIsClearing(false);
              alert('Global Cache Cleared! Site data has been re-synchronized.');
              window.location.reload();
          }, 1000);
      }
  };

  return (
    <AdminLayout>
      <SEO title="Admin Dashboard" />
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <div className="flex gap-4">
            <button 
                onClick={handleClearCache}
                disabled={isClearing}
                className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
                {isClearing ? <RefreshCcw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {isClearing ? 'Clearing...' : 'Clear Global Cache'}
            </button>
            <button 
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
            <HelpCircle size={18} />
            {showGuide ? 'Hide Help' : 'Deployment Help'}
            </button>
        </div>
      </div>

      {showGuide && (
        <div className="mb-8 bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Maintenance & Deployment Guide</h3>
              <p className="text-blue-100 text-sm mt-1">Manage your enterprise system effectively.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <h4 className="font-bold flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                Clear Cache Frequently
              </h4>
              <p className="text-sm text-blue-50 leading-relaxed mb-4">
                If you update product SEO or images and don't see changes immediately (especially in Incognito), use the <strong>Clear Global Cache</strong> button above.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <h4 className="font-bold flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                Secure Secrets
              </h4>
              <p className="text-sm text-blue-50 leading-relaxed mb-4">
                Your API Keys are now hidden from the browser. They only exist on the server side for maximum security.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/products" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 transition-all group">
          <div className="text-slate-500 text-sm font-medium uppercase mb-2 group-hover:text-blue-500 transition-colors">Total Products</div>
          <div className="text-4xl font-bold text-slate-900">{productsCount}</div>
        </Link>
        <Link to="/admin/quotes" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 transition-all group">
          <div className="text-slate-500 text-sm font-medium uppercase mb-2 group-hover:text-blue-500 transition-colors">Pending Quotes</div>
          <div className="text-4xl font-bold text-blue-600">{(quotes || []).filter(q => q.status === 'Pending').length}</div>
        </Link>
        <Link to="/admin/orders" className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 transition-all group">
          <div className="text-slate-500 text-sm font-medium uppercase mb-2 group-hover:text-blue-500 transition-colors">Revenue (YTD)</div>
          <div className="text-4xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Activity (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }} 
                cursor={{fill: '#f1f5f9'}}
              />
              <Bar dataKey="quotes" name="Quotes" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
};
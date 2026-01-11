import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;
import { AdminLayout } from '../components/AdminLayout';
import { getProducts, getQuotes, getOrders, formatCurrency, clearAllCache } from '../services/db';
import { SEO } from '../components/SEO';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, Trash2, RefreshCcw, HelpCircle } from '../components/Icons';
import { useApp } from '../App';

export const AdminDashboard: React.FC = () => {
  const { refreshGlobalData } = useApp();
  const [productsCount, setProductsCount] = useState(0);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
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
         return { name, quotes: quotesCount, orders: ordersCount };
      });
      setChartData(data);
    };
    loadDashboardData();
  }, []);

  const handleClearCache = async () => {
      if (window.confirm('This will purge all local cache for every user. If your recent changes are not appearing in Incognito mode, this will fix it. Proceed?')) {
          setIsClearing(true);
          clearAllCache();
          await refreshGlobalData(true);
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
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-500 text-sm">System performance and analytics.</p>
        </div>
        <button 
            onClick={handleClearCache}
            disabled={isClearing}
            className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-50 border border-red-100 px-5 py-2.5 rounded-xl hover:bg-red-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
            {isClearing ? <RefreshCcw size={18} className="animate-spin" /> : <Trash2 size={18} />}
            {isClearing ? 'Purging Cache...' : 'Clear Global Cache'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/products" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group">
          <div className="text-slate-400 text-xs font-black uppercase mb-2 tracking-widest group-hover:text-blue-500">Total Catalog</div>
          <div className="text-4xl font-bold text-slate-900">{productsCount}</div>
        </Link>
        <Link to="/admin/quotes" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group">
          <div className="text-slate-400 text-xs font-black uppercase mb-2 tracking-widest group-hover:text-blue-500">Active Quotes</div>
          <div className="text-4xl font-bold text-blue-600">{(quotes || []).filter(q => q.status === 'Pending').length}</div>
        </Link>
        <Link to="/admin/orders" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all group">
          <div className="text-slate-400 text-xs font-black uppercase mb-2 tracking-widest group-hover:text-blue-500">Revenue (YTD)</div>
          <div className="text-4xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</div>
        </Link>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            Traffic Activity (7 Days)
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#94a3b8', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }} 
                cursor={{fill: '#f8fafc'}}
              />
              <Bar dataKey="quotes" name="Quotes" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="orders" name="Orders" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
};
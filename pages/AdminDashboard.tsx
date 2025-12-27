
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { getProducts, getQuotes, getOrders, formatCurrency } from '../services/db';
import { SEO } from '../components/SEO';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertCircle, ExternalLink, HelpCircle, Terminal } from '../components/Icons';

export const AdminDashboard: React.FC = () => {
  const [productsCount, setProductsCount] = useState(0);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      const allProducts = await getProducts();
      setProductsCount(allProducts.length);
      
      const allQuotes = await getQuotes();
      setQuotes(allQuotes);
      
      const allOrders = await getOrders();
      setOrders(allOrders);
      
      const revenue = allOrders.reduce((sum, order) => sum + order.total, 0);
      setTotalRevenue(revenue);
      
      // Calculate analytics data for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const data = last7Days.map(dateStr => {
         const dateObj = new Date(dateStr);
         const name = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
         const quotesCount = allQuotes.filter(q => q.date.startsWith(dateStr)).length;
         const ordersCount = allOrders.filter(o => o.date.startsWith(dateStr)).length;
         
         return {
             name,
             quotes: quotesCount,
             orders: ordersCount
         };
      });
      setChartData(data);
    };
    loadDashboardData();
  }, []);

  return (
    <AdminLayout>
      <SEO title="Admin Dashboard" />
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
        <button 
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          <HelpCircle size={18} />
          {showGuide ? 'Hide Help' : 'GCP Deployment Help'}
        </button>
      </div>

      {showGuide && (
        <div className="mb-8 bg-blue-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Can't find the "Edit & Deploy" button?</h3>
              <p className="text-blue-100 text-sm mt-1">If you are seeing <span className="font-black bg-blue-800 px-1 rounded">"DEPLOY A CONTAINER"</span>, you are on the wrong page.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <h4 className="font-bold flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs">1</span>
                Go to the Service Details
              </h4>
              <p className="text-sm text-blue-50 leading-relaxed mb-4">
                You are currently looking at the <strong>Service List</strong>. You must click the <strong>blue name</strong> of your service (e.g., <span className="underline decoration-wavy">servers2-app</span>) in the table.
              </p>
              <div className="bg-blue-800/50 rounded-lg p-3 text-[10px] font-mono border border-white/5">
                Cloud Run {' > '} <span className="text-white">servers2-app</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-5 border border-white/10">
              <h4 className="font-bold flex items-center gap-2 mb-3">
                <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center text-xs">2</span>
                Check the Header Bar
              </h4>
              <p className="text-sm text-blue-50 leading-relaxed mb-4">
                Once inside the service, look at the <strong>Top White Bar</strong>. If your screen is small, click the <strong>three dots (⋮)</strong> to find it.
              </p>
              <div className="flex gap-2">
                <div className="bg-white text-blue-600 px-3 py-1.5 rounded-md text-[10px] font-black uppercase">Edit & Deploy New Revision</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-blue-100">
              <Terminal size={14} />
              <span>Make sure you created your 3 secrets first in Secret Manager!</span>
            </div>
            <a 
              href="https://console.cloud.google.com/run" 
              target="_blank" 
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-50 transition-all"
            >
              Open Cloud Run <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/admin/products" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase mb-2 group-hover:text-blue-500 transition-colors">Total Products</div>
          <div className="text-4xl font-bold text-slate-900 dark:text-white">{productsCount}</div>
        </Link>
        <Link to="/admin/quotes" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase mb-2 group-hover:text-blue-500 transition-colors">Pending Quotes</div>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{quotes.filter(q => q.status === 'Pending').length}</div>
        </Link>
        <Link to="/admin/orders" className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-all group">
          <div className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase mb-2 group-hover:text-blue-500 transition-colors">Revenue (YTD)</div>
          <div className="text-4xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue)}</div>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Activity (Last 7 Days)</h3>
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

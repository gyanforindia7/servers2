import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;
import { AdminLayout } from '../components/AdminLayout';
import { getProducts, getQuotes, getOrders, formatCurrency } from '../services/db';
import { SEO } from '../components/SEO';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../App';

export const AdminDashboard: React.FC = () => {
  const [productsCount, setProductsCount] = useState(0);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

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

  return (
    <AdminLayout>
      <SEO title="Admin Dashboard" />
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
      </div>
      
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

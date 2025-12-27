
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Box, FileText, ArrowRight, Tag, Briefcase, Package, MessageSquare, Settings, Ticket, Newspaper, Menu, X, Sun, Moon } from './Icons';
import { useApp } from '../App';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { user } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { label: 'Orders', path: '/admin/orders', icon: <Package size={18} /> },
    { label: 'Quotes', path: '/admin/quotes', icon: <FileText size={18} /> },
    { label: 'Products', path: '/admin/products', icon: <Box size={18} /> },
    { label: 'Categories', path: '/admin/categories', icon: <Tag size={18} /> },
    { label: 'Brands', path: '/admin/brands', icon: <Briefcase size={18} /> },
    { label: 'Inbox', path: '/admin/messages', icon: <MessageSquare size={18} /> },
    { label: 'Coupons', path: '/admin/coupons', icon: <Ticket size={18} /> },
    { label: 'Blog', path: '/admin/blog', icon: <Newspaper size={18} /> },
    { label: 'CMS', path: '/admin/cms', icon: <Settings size={18} /> },
  ];

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-900 text-white flex flex-col h-screen transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tighter">ADMIN <span className="text-blue-50">P7</span></h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800 space-y-4">
            <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <div className="text-[10px] text-slate-500 text-center uppercase tracking-widest">
                v2.0-STABLE
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Admin Header */}
        <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-4 flex items-center justify-between md:px-8">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-slate-500" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <h2 className="text-lg font-bold truncate">Management</h2>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                    <div className="text-xs font-bold">{user.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">System Admin</div>
                </div>
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

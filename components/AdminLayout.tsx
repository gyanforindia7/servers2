import React, { useState, createContext, useContext, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useLocation, useNavigate } = ReactRouterDOM as any;
import { 
  LayoutDashboard, Box, FileText, Tag, Briefcase, Package, 
  MessageSquare, Settings, Ticket, Newspaper, Menu, X, LogOut,
  CheckCircle, AlertCircle
} from './Icons';
import { useApp } from '../App';

interface AdminContextType {
  notify: (message: string, type?: 'success' | 'error') => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminLayout');
  return context;
};

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AdminContext.Provider value={{ notify }}>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors">
        {/* Toast Notification */}
        {notification && (
          <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right duration-300">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
              notification.type === 'success' 
              ? 'bg-emerald-600 border-emerald-500 text-white' 
              : 'bg-red-600 border-red-500 text-white'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-bold text-sm">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col h-screen transition-transform duration-300 md:translate-x-0 md:sticky md:top-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-black tracking-tighter">ADMIN <span className="text-blue-500">PRO</span></h1>
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
          <div className="p-6 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 text-center uppercase tracking-widest">
                  v2.5-ENTERPRISE
              </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Admin Header */}
          <header className="bg-white border-b p-4 flex items-center justify-between md:px-8">
              <div className="flex items-center gap-4">
                  <button className="md:hidden text-slate-500" onClick={() => setIsSidebarOpen(true)}>
                      <Menu size={24} />
                  </button>
                  <h2 className="text-lg font-bold truncate">Management Console</h2>
              </div>
              <div className="flex items-center gap-4">
                  <button 
                    onClick={handleLogout}
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                  <div className="hidden sm:block text-right">
                      <div className="text-xs font-bold">{user.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest">System Administrator</div>
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
    </AdminContext.Provider>
  );
};

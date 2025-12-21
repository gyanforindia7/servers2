
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { ProductList } from './pages/ProductList';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { ThankYou } from './pages/ThankYou';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { BlogList } from './pages/BlogList';
import { BlogDetail } from './pages/BlogDetail';
import { DynamicPage } from './pages/DynamicPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminProducts } from './pages/AdminProducts';
import { AdminCategories } from './pages/AdminCategories';
import { AdminBrands } from './pages/AdminBrands';
import { AdminOrders } from './pages/AdminOrders';
import { AdminQuotes } from './pages/AdminQuotes';
import { AdminMessages } from './pages/AdminMessages';
import { AdminCoupons } from './pages/AdminCoupons';
import { AdminBlog } from './pages/AdminBlog';
import { AdminCMS } from './pages/AdminCMS';
import { AdminLogin } from './pages/AdminLogin';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { QuoteModal } from './components/QuoteModal';
import { AuthModal } from './components/AuthModal';
import { Analytics } from './components/Analytics';
import { CartItem, Product, User, SiteSettings } from './types';
import { createOrder, getSiteSettings, saveSiteSettings } from './services/db';

// Application Context
interface AppContextType {
  cart: CartItem[];
  user: User | null;
  settings: SiteSettings;
  addToCart: (product: Product, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: () => void;
  login: (user: User) => void;
  logout: () => void;
  openAuthModal: () => void;
  openQuoteModal: (product?: {id: string, name: string, quantity: number}) => void;
  updateSettings: (settings: SiteSettings) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within a AppProvider');
  return context;
};

// Protected Admin Route
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useApp();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }
  return children;
};

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(getSiteSettings());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteProduct, setQuoteProduct] = useState<{id: string, name: string, quantity: number} | null>(null);

  useEffect(() => {
    // In a real app we'd check session/token
  }, []);

  const addToCart = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCart([]);

  const checkout = () => {
    alert('Please use the checkout page.');
  };

  const openQuoteModal = (product?: {id: string, name: string, quantity: number}) => {
    setQuoteProduct(product || null);
    setIsQuoteOpen(true);
  };

  const updateSettings = (newSettings: SiteSettings) => {
    saveSiteSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <AppContext.Provider value={{ 
      cart, user, settings, addToCart, removeFromCart, clearCart, checkout,
      login: setUser, logout: () => setUser(null),
      openAuthModal: () => setIsAuthOpen(true),
      openQuoteModal,
      updateSettings
    }}>
      <Router>
        <Analytics />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/search" element={<Layout><ProductList /></Layout>} />
          <Route path="/category/:categorySlug" element={<Layout><ProductList /></Layout>} />
          <Route path="/product/:slug" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/cart" element={<Layout><Cart /></Layout>} />
          <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
          <Route path="/thank-you" element={<Layout><ThankYou /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/blog" element={<Layout><BlogList /></Layout>} />
          <Route path="/blog/:slug" element={<Layout><BlogDetail /></Layout>} />
          <Route path="/page/:slug" element={<Layout><DynamicPage /></Layout>} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Customer Routes */}
          <Route path="/dashboard" element={<Layout><CustomerDashboard /></Layout>} />

          {/* Protected Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/brands" element={<AdminRoute><AdminBrands /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/quotes" element={<AdminRoute><AdminQuotes /></AdminRoute>} />
          <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
          <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
          <Route path="/admin/cms" element={<AdminRoute><AdminCMS /></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>

      <QuoteModal 
        isOpen={isQuoteOpen} 
        onClose={() => setIsQuoteOpen(false)} 
        initialProduct={quoteProduct} 
      />
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={(u) => setUser(u)} 
      />
    </AppContext.Provider>
  );
};

export default App;

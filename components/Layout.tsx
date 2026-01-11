
import React, { useState, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
// Fix: Destructure from namespace import with any cast to resolve environment export issues
const { Link, useNavigate } = ReactRouterDOM as any;
import { useApp } from '../App';
import { ShoppingCart, Menu, X, Search, Server, Phone, Mail, FileText, UserCircle, LogOut, User, MapPin, ChevronDown, ChevronRight, Tag, Briefcase, Sun, Moon } from './Icons';
import { formatCurrency, getProducts } from '../services/db';
import { Breadcrumbs } from './Breadcrumbs';
import { Product, Category, Brand, PageContent } from '../types';
import { WhatsAppButton } from './WhatsAppButton';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cart, user, logout, openAuthModal, openQuoteModal, settings, categories, pages, brands, isDataLoaded } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [categoryResults, setCategoryResults] = useState<Category[]>([]);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      const lowerQ = query.toLowerCase();
      // Filter Categories
      setCategoryResults(categories.filter(c => c.name.toLowerCase().includes(lowerQ)).slice(0, 3));
      
      // Filter Products (Dynamic fetching from cache/mem)
      const allProducts = await getProducts();
      const matchedProducts = allProducts.filter(p => p.isActive !== false).filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.sku.toLowerCase().includes(lowerQ) ||
        p.category.toLowerCase().includes(lowerQ)
      ).slice(0, 5);
      
      setProductResults(matchedProducts);
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchDropdown(false);
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleResultClick = (path: string) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const navCategories = categories.filter(c => !c.parentId && c.showInMenu !== false);
  const navPages = pages.filter(p => p.showInMenu !== false);
  const footerCategories = categories.filter(c => !c.parentId && c.showInFooter !== false);
  const footerPages = pages.filter(p => p.showInFooter !== false);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <WhatsAppButton />
      {/* Top Bar */}
      <div className="bg-slate-900 dark:bg-black text-slate-300 text-[10px] md:text-xs py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex gap-4 md:gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="flex items-center gap-2 shrink-0"><Phone size={12} /> {settings.supportPhone}</span>
            <span className="flex items-center gap-2 shrink-0"><Mail size={12} /> {settings.supportEmail}</span>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Premium Enterprise Solutions</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="SERVERS 2" className="h-8 md:h-12 w-auto object-contain max-w-[140px] md:max-w-[240px]" />
              ) : (
                <div className="flex items-center gap-2 font-black text-lg tracking-tighter dark:text-white uppercase">SERVERS <span className="text-blue-600">2</span></div>
              )}
            </Link>

            <nav className="hidden xl:flex items-center gap-6">
              <Link to="/" className="text-sm font-bold uppercase tracking-wide hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">Home</Link>
              {navCategories.map(cat => (
                <div key={cat.id} className="relative group py-6">
                  <Link to={`/category/${cat.slug}`} className="text-sm font-bold uppercase tracking-wide flex items-center gap-1 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                    {cat.name} {categories.some(c => c.parentId === cat.id) && <ChevronDown size={12} />}
                  </Link>
                  {categories.some(c => c.parentId === cat.id) && (
                    <div className="absolute top-full left-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-b-xl w-52 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      {categories.filter(c => c.parentId === cat.id).map(child => (
                        <Link key={child.id} to={`/category/${child.slug}`} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">{child.name}</Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {navPages.map(p => <Link key={p.id} to={`/page/${p.slug}`} className="text-sm font-bold uppercase tracking-wide hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">{p.title}</Link>)}
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden lg:block relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit}>
                  <input 
                    type="text" 
                    placeholder="Search catalog..." 
                    className="pl-4 pr-10 py-2 w-40 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 text-sm transition-all focus:w-64 dark:text-white" 
                    value={searchQuery} 
                    onChange={handleSearchChange} 
                  />
                  <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-600"><Search size={16} /></button>
                </form>
                {showSearchDropdown && (categoryResults.length > 0 || productResults.length > 0) && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                      <ul className="text-sm max-h-80 overflow-y-auto">
                        {categoryResults.length > 0 && (
                          <li className="bg-slate-50 dark:bg-slate-900 px-4 py-1 text-[10px] font-bold uppercase text-slate-400">Categories</li>
                        )}
                        {categoryResults.map(c => (
                          <li key={c.id}><button onClick={() => handleResultClick(`/category/${c.slug}`)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white flex items-center gap-2"><Tag size={12}/> {c.name}</button></li>
                        ))}
                        {productResults.length > 0 && (
                          <li className="bg-slate-50 dark:bg-slate-900 px-4 py-1 text-[10px] font-bold uppercase text-slate-400">Products</li>
                        )}
                        {productResults.map(p => (
                          <li key={p.id}><button onClick={() => handleResultClick(`/product/${p.slug}`)} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white flex items-center gap-2">
                            <img src={p.imageUrl} alt="" className="w-8 h-8 object-contain rounded bg-slate-100" />
                            <div className="truncate">
                              <div className="font-semibold truncate">{p.name}</div>
                              <div className="text-[10px] text-blue-600">{formatCurrency(p.price)}</div>
                            </div>
                          </button></li>
                        ))}
                      </ul>
                   </div>
                )}
              </div>
              <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
              <Link to="/cart" className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600">
                <ShoppingCart size={22} />
                {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">{cart.reduce((a, i) => a + i.quantity, 0)}</span>}
              </Link>
              <button onClick={() => user ? navigate(user.role === 'admin' ? '/admin' : '/dashboard') : openAuthModal()} className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600">
                {user ? <UserCircle size={22} /> : <User size={22} />}
              </button>
              <button className="xl:hidden p-2 text-slate-600 dark:text-slate-400" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-white dark:bg-slate-900 border-t dark:border-slate-800 animate-in slide-in-from-top duration-300">
            <nav className="p-4 space-y-4">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block font-bold text-slate-900 dark:text-white uppercase text-sm">Home</Link>
              {navCategories.map(cat => (
                <div key={cat.id} className="space-y-2">
                  <Link to={`/category/${cat.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="block font-bold text-slate-900 dark:text-white uppercase text-sm">{cat.name}</Link>
                  {categories.filter(c => c.parentId === cat.id).map(child => (
                    <Link key={child.id} to={`/category/${child.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="block pl-4 text-sm text-slate-600 dark:text-slate-400">{child.name}</Link>
                  ))}
                </div>
              ))}
              {navPages.map(p => <Link key={p.id} to={`/page/${p.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="block font-bold text-slate-900 dark:text-white uppercase text-sm">{p.title}</Link>)}
              
              <div className="pt-4 border-t dark:border-slate-800">
                 <form onSubmit={handleSearchSubmit} className="relative">
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none dark:text-white text-sm"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                 </form>
              </div>
            </nav>
          </div>
        )}
      </header>

      <Breadcrumbs />
      <main className="flex-1">{children}</main>

      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 md:py-20 border-t dark:border-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">About Us</h3>
              <p className="text-sm leading-relaxed">Enterprise hardware specialists since 2010. Powering infrastructure with reliable, certified new and refurbished tech solutions.</p>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">Solutions</h3>
              <ul className="space-y-2 text-sm">
                {footerCategories.map(c => <li key={c.id}><Link to={`/category/${c.slug}`} className="hover:text-blue-400 transition-colors">{c.name}</Link></li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                {footerPages.map(p => <li key={p.id}><Link to={`/page/${p.slug}`} className="hover:text-blue-400 transition-colors">{p.title}</Link></li>)}
              </ul>
            </div>
            <div>
               <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">Contact Details</h3>
               <ul className="space-y-3 text-sm">
                 <li className="flex gap-3"><MapPin size={18} className="text-blue-500 shrink-0"/> <span className="max-w-[200px]">{settings.address}</span></li>
                 <li className="flex gap-3"><Phone size={18} className="text-blue-500 shrink-0"/> <span>{settings.supportPhone}</span></li>
                 <li className="flex gap-3"><Mail size={18} className="text-blue-500 shrink-0"/> <span>{settings.supportEmail}</span></li>
               </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 dark:border-slate-900 text-center text-xs">
            &copy; {new Date().getFullYear()} SERVERS 2. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

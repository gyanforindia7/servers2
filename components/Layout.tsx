
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../App';
import { ShoppingCart, Menu, X, Search, Server, Phone, Mail, FileText, UserCircle, LogOut, User, MapPin, ChevronDown, ChevronRight, Tag, Briefcase, Sun, Moon } from './Icons';
import { getCategoryHierarchy, getProducts, getCategories, getBrands, formatCurrency, getPages } from '../services/db';
import { Breadcrumbs } from './Breadcrumbs';
import { Product, Category, Brand, PageContent } from '../types';
import { WhatsAppButton } from './WhatsAppButton';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cart, user, logout, openAuthModal, openQuoteModal, settings } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [categoryResults, setCategoryResults] = useState<Category[]>([]);
  const [brandResults, setBrandResults] = useState<Brand[]>([]);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [expandedMobileCats, setExpandedMobileCats] = useState<string[]>([]);
  
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [navPages, setNavPages] = useState<PageContent[]>([]);
  const [footerCategories, setFooterCategories] = useState<Category[]>([]);
  const [footerPages, setFooterPages] = useState<PageContent[]>([]);

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
    const loadNavData = async () => {
      const hierarchy = await getCategoryHierarchy();
      setCategoryTree(hierarchy.filter(c => c.showInMenu !== false));
      
      const allPages = await getPages();
      setNavPages(allPages.filter(p => p.showInMenu !== false));
      
      const allCategories = await getCategories();
      setFooterCategories(allCategories.filter(c => !c.parentId && c.showInFooter !== false));
      setFooterPages(allPages.filter(p => p.showInFooter !== false));
    };
    loadNavData();
  }, []);

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
      const allCats = await getCategories();
      const matchedCats = allCats.filter(c => c.name.toLowerCase().includes(lowerQ)).slice(0, 3);
      setCategoryResults(matchedCats);

      const allBrands = await getBrands();
      const matchedBrands = allBrands.filter(b => b.name.toLowerCase().includes(lowerQ)).slice(0, 3);
      setBrandResults(matchedBrands);

      const allProducts = await getProducts();
      const filteredProducts = allProducts.filter(p => p.isActive !== false).filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.category.toLowerCase().includes(lowerQ) ||
        p.sku.toLowerCase().includes(lowerQ)
      ).slice(0, 5); 
      setProductResults(filteredProducts);
      
      setShowSearchDropdown(true);
    } else {
      setProductResults([]);
      setCategoryResults([]);
      setBrandResults([]);
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

  const handleSearchResultClick = (path: string) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    navigate(path);
  };

  const toggleMobileCat = (catId: string) => {
    setExpandedMobileCats(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

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
          {/* Admin link removed from public top bar */}
          <div className="hidden md:block">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Premium Enterprise Solutions</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 overflow-hidden">
              {settings.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt="SERVERS 2" 
                  className="h-8 md:h-12 w-auto max-w-[120px] md:max-w-[250px] object-contain dark:brightness-110" 
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
                    <Server size={20} />
                  </div>
                  <span className="hidden sm:inline font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tighter">SERVERS <span className="text-blue-600">2</span></span>
                  <span className="sm:hidden font-bold text-slate-900 dark:text-white uppercase tracking-tighter">S2</span>
                </div>
              )}
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center gap-6 flex-wrap justify-end mx-4">
              <Link to="/" className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-wide">Home</Link>
              
              {categoryTree.map((cat) => (
                <div key={cat.id} className="relative group">
                    <Link 
                      to={`/category/${cat.slug}`}
                      className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wide flex items-center gap-1 py-6"
                    >
                      {cat.name} {cat.children && cat.children.length > 0 && <ChevronDown size={12} />}
                    </Link>

                    {cat.children && cat.children.length > 0 && (
                        <div className="absolute top-full left-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl rounded-b-xl w-56 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
                            {cat.children.map(child => (
                                <Link 
                                    key={child.id}
                                    to={`/category/${child.slug}`}
                                    className="block px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {child.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
              ))}
              
              {navPages.map(page => (
                <Link 
                  key={page.id} 
                  to={`/page/${page.slug}`} 
                  className="text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-wide"
                >
                  {page.title}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-3">
              <div className="hidden lg:block relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    placeholder="Search catalog..."
                    className="pl-4 pr-10 py-2 w-40 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-600 text-sm transition-all focus:w-64 dark:text-white"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  <button type="submit" className="absolute right-3 top-2.5 text-slate-400 hover:text-blue-600">
                    <Search size={16} />
                  </button>
                </form>

                {showSearchDropdown && (productResults.length > 0 || categoryResults.length > 0 || brandResults.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                    <ul className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {categoryResults.length > 0 && (
                            <>
                                <li className="bg-slate-50 dark:bg-slate-900 px-4 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</li>
                                {categoryResults.map(cat => (
                                    <li key={cat.id}>
                                        <button 
                                            onClick={() => handleSearchResultClick(`/category/${cat.slug}`)}
                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors border-b border-slate-50 dark:border-slate-700"
                                        >
                                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500"><Tag size={14} /></div>
                                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{cat.name}</div>
                                        </button>
                                    </li>
                                ))}
                            </>
                        )}
                        {productResults.map(product => (
                                <li key={product.id}>
                                    <button 
                                    onClick={() => handleSearchResultClick(`/product/${product.slug}`)}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0"
                                    >
                                    <img src={product.imageUrl} alt="" className="w-10 h-10 rounded object-cover bg-slate-100 dark:bg-slate-700" />
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">{product.name}</div>
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(product.price)}</div>
                                    </div>
                                    </button>
                                </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <button 
                onClick={() => openQuoteModal()}
                className="hidden md:flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors"
              >
                <FileText size={16} /> <span className="hidden lg:inline">Get Quote</span>
              </button>

              <Link to="/cart" className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600">
                <ShoppingCart size={22} />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </Link>

              <div className="relative">
                <button 
                  onClick={() => user ? setIsProfileOpen(!isProfileOpen) : openAuthModal()}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600"
                >
                  {user ? <UserCircle size={22} /> : <User size={22} />}
                </button>
                
                {isProfileOpen && user && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    {user.role === 'admin' ? (
                      <Link to="/admin" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Admin Dashboard</Link>
                    ) : (
                      <Link to="/dashboard" onClick={() => setIsProfileOpen(false)} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">My Orders</Link>
                    )}
                    <button 
                      onClick={() => { logout(); setIsProfileOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>

              <button 
                className="xl:hidden p-2 text-slate-600 dark:text-slate-400"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <Breadcrumbs />

      {/* Mobile Nav Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-[85%] max-w-[320px] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
               <span className="font-bold dark:text-white uppercase tracking-widest text-sm">Main Menu</span>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-500 dark:text-slate-400">
                 <X size={24} />
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <form onSubmit={handleSearchSubmit} className="mb-6 relative">
                 <input
                  type="text"
                  placeholder="Search catalog..."
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none dark:text-white"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <button type="submit" className="absolute right-3 top-3.5 text-slate-400">
                    <Search size={18}/>
                </button>
              </form>
              <nav className="flex flex-col gap-1">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-slate-900 dark:text-white py-3 border-b dark:border-slate-800 uppercase tracking-wide">Home</Link>
                
                {categoryTree.map((cat) => (
                  <div key={cat.id} className="border-b dark:border-slate-800 last:border-0">
                      <div className="flex items-center justify-between py-3">
                        <Link 
                            to={`/category/${cat.slug}`}
                            className="text-base font-bold text-slate-900 dark:text-white flex-1 uppercase tracking-wide"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {cat.name}
                        </Link>
                        {cat.children && cat.children.length > 0 && (
                            <button onClick={() => toggleMobileCat(cat.id)} className="p-2 text-slate-500 dark:text-slate-400">
                                {expandedMobileCats.includes(cat.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                        )}
                      </div>
                      {cat.children && cat.children.length > 0 && expandedMobileCats.includes(cat.id) && (
                          <div className="pl-4 pb-2 bg-slate-50 dark:bg-slate-800 rounded-lg mb-2">
                              {cat.children.map(child => (
                                  <Link 
                                    key={child.id}
                                    to={`/category/${child.slug}`}
                                    className="block py-2 text-sm text-slate-600 dark:text-slate-400"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                      {child.name}
                                  </Link>
                              ))}
                          </div>
                      )}
                  </div>
                ))}
                
                {navPages.map(page => (
                     <Link key={page.id} to={`/page/${page.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="text-base font-bold text-slate-900 dark:text-white py-3 border-b dark:border-slate-800 uppercase tracking-wide">
                        {page.title}
                     </Link>
                ))}
              </nav>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t dark:border-slate-700">
              <button 
                onClick={() => { setIsMobileMenuOpen(false); openQuoteModal(); }}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <FileText size={18} /> Get Custom Quote
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-12 md:py-20 border-t dark:border-slate-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div>
              <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">About SERVERS 2</h3>
              <p className="text-sm leading-relaxed mb-6">
                Premium enterprise hardware provider since 2010. We specialize in certified refurbished and new IT infrastructure solutions, powering businesses with reliable tech.
              </p>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">Solutions</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
                {footerCategories.map(cat => (
                    <li key={cat.id}>
                        <Link to={`/category/${cat.slug}`} className="hover:text-blue-400 transition-colors">{cat.name}</Link>
                    </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">Support</h3>
              <ul className="space-y-3 text-sm">
                <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Us</Link></li>
                {footerPages.map(page => (
                    <li key={page.id}>
                        <Link to={`/page/${page.slug}`} className="hover:text-blue-400 transition-colors">{page.title}</Link>
                    </li>
                ))}
              </ul>
            </div>
            <div>
               <h3 className="text-white text-lg font-bold mb-4 uppercase tracking-wider">Contact Details</h3>
               <ul className="space-y-4 text-sm">
                 <li className="flex gap-3"><MapPin size={18} className="text-blue-600 shrink-0"/> <span className="max-w-[200px]">{settings.address}</span></li>
                 <li className="flex gap-3"><Phone size={18} className="text-blue-600 shrink-0"/> <span>{settings.supportPhone}</span></li>
                 <li className="flex gap-3"><Mail size={18} className="text-blue-600 shrink-0"/> <span>{settings.supportEmail}</span></li>
               </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 dark:border-slate-900 mt-12 pt-8 text-center text-[10px] md:text-xs">
            &copy; {new Date().getFullYear()} SERVERS 2. All rights reserved. Registered Enterprise Hardware Provider.
          </div>
        </div>
      </footer>
    </div>
  );
};

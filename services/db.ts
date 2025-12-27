import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * RESILIENT DATABASE SERVICE
 * Redundancy Path: Backend API -> LocalStorage Cache -> Initial Constants
 */

const API_URL = '/api';

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    
    // 30s timeout for cloud environments
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const config: RequestInit = { 
        method, 
        headers,
        signal: controller.signal
    };
    
    if (body) config.body = JSON.stringify(body);
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    try {
        const response = await fetch(`${API_URL}${path}`, config);
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        return await response.json();
    } catch (err) {
        clearTimeout(timeoutId);
        throw err;
    }
};

// --- Local Storage Sync ---
const CACHE_KEYS = {
    PRODUCTS: 's2_cache_products',
    CATEGORIES: 's2_cache_categories',
    PAGES: 's2_cache_pages',
    QUOTES: 's2_cache_quotes',
    MESSAGES: 's2_cache_messages',
    BRANDS: 's2_cache_brands',
    SETTINGS: 's2_cache_settings'
};

const getCache = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const setCache = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// --- Products ---
export const getProducts = async (): Promise<Product[]> => {
    try {
        const apiData = await apiRequest('/products/all');
        const cache = getCache(CACHE_KEYS.PRODUCTS);
        // Merge: API data takes priority, but keep local-only items
        const combined = [...apiData, ...cache.filter((c: any) => !apiData.find((a: any) => a.id === c.id))];
        const final = combined.length > 0 ? combined : INITIAL_PRODUCTS;
        setCache(CACHE_KEYS.PRODUCTS, final); // Keep cache warm
        return final;
    } catch {
        const cache = getCache(CACHE_KEYS.PRODUCTS);
        return cache.length > 0 ? cache : INITIAL_PRODUCTS;
    }
};

export const saveProduct = async (product: Product): Promise<void> => {
    const cache = getCache(CACHE_KEYS.PRODUCTS);
    const updatedCache = [...cache.filter((p: any) => p.id !== product.id), product];
    setCache(CACHE_KEYS.PRODUCTS, updatedCache);

    try {
        if (product.id && !product.id.startsWith('p-new')) {
            await apiRequest(`/products/${product.id}`, 'PUT', product);
        } else {
            await apiRequest('/products', 'POST', { ...product, id: `p-${Date.now()}` });
        }
    } catch (err) {
        console.warn("Backend unsynced, product saved in browser cache.", err);
    }
};

export const deleteProduct = async (id: string): Promise<void> => {
    const cache = getCache(CACHE_KEYS.PRODUCTS);
    setCache(CACHE_KEYS.PRODUCTS, cache.filter((p: any) => p.id !== id));
    try { await apiRequest(`/products/${id}`, 'DELETE'); } catch {}
};

export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
    const products = await getProducts();
    return products.find(p => p.slug === slug);
};

export const getProductsByCategory = async (categoryName: string): Promise<Product[]> => {
    const all = await getProducts();
    return all.filter(p => p.category === categoryName && p.isActive !== false);
};

export const getSimilarProducts = async (product: Product): Promise<Product[]> => {
    const all = await getProducts();
    return all.filter(p => p.category === product.category && p.id !== product.id && p.isActive !== false).slice(0, 5);
};

// --- Categories ---
export const getCategories = async (): Promise<Category[]> => {
    const fallback = INITIAL_CATEGORY_NAMES.map((name, i) => ({
        id: `cat-${i}`, name, slug: name.toLowerCase().replace(/ /g, '-'), showOnHome: true, showInMenu: true
    }));
    try {
        const apiData = await apiRequest('/categories');
        const cache = getCache(CACHE_KEYS.CATEGORIES);
        const combined = [...apiData, ...cache.filter((c: any) => !apiData.find((a: any) => a.id === c.id))];
        const final = combined.length > 0 ? combined : fallback;
        setCache(CACHE_KEYS.CATEGORIES, final);
        return final;
    } catch {
        const cache = getCache(CACHE_KEYS.CATEGORIES);
        return cache.length > 0 ? cache : fallback;
    }
};

export const saveCategory = async (cat: Category): Promise<void> => {
    const cache = getCache(CACHE_KEYS.CATEGORIES);
    setCache(CACHE_KEYS.CATEGORIES, [...cache.filter((c: any) => c.id !== cat.id), cat]);
    try { await apiRequest('/categories', 'POST', cat); } catch {}
};

export const deleteCategory = async (id: string): Promise<void> => {
    const cache = getCache(CACHE_KEYS.CATEGORIES);
    setCache(CACHE_KEYS.CATEGORIES, cache.filter((c: any) => c.id !== id));
    try { await apiRequest(`/categories/${id}`, 'DELETE'); } catch {}
};

export const getCategoryBySlug = async (slug: string): Promise<Category | undefined> => {
    const cats = await getCategories();
    return cats.find(c => c.slug === slug);
};

export const getCategoryHierarchy = async (): Promise<Category[]> => {
    const all = await getCategories();
    return all.filter(c => !c.parentId);
};

// --- Quotes & Inquiries ---
export const submitQuote = async (quote: any): Promise<void> => {
    const fullQuote = { ...quote, id: `QT-${Date.now()}`, date: new Date().toISOString(), status: 'Pending' };
    const cache = getCache(CACHE_KEYS.QUOTES);
    setCache(CACHE_KEYS.QUOTES, [...cache, fullQuote]);
    
    try {
        await apiRequest('/quotes', 'POST', quote);
    } catch (err) {
        console.error("Quote submission failed on backend, but saved locally.", err);
        throw err;
    }
};

export const getQuotes = async (): Promise<QuoteRequest[]> => {
    try {
        const apiData = await apiRequest('/quotes');
        const cache = getCache(CACHE_KEYS.QUOTES);
        const final = [...apiData, ...cache.filter((c: any) => !apiData.find((a: any) => a.id === c.id))];
        return final.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
        return getCache(CACHE_KEYS.QUOTES);
    }
};

export const updateQuoteStatus = async (id: string, status: string): Promise<void> => {
    const cache = getCache(CACHE_KEYS.QUOTES);
    setCache(CACHE_KEYS.QUOTES, cache.map((q: any) => q.id === id ? { ...q, status } : q));
    try { await apiRequest(`/quotes/${id}/status`, 'PATCH', { status }); } catch {}
};

export const deleteQuote = async (id: string): Promise<void> => {
    const cache = getCache(CACHE_KEYS.QUOTES);
    setCache(CACHE_KEYS.QUOTES, cache.filter((q: any) => q.id !== id));
    try { await apiRequest(`/quotes/${id}`, 'DELETE'); } catch {}
};

// --- Settings ---
export const getSiteSettings = async (): Promise<SiteSettings> => {
    try {
        const settings = await apiRequest('/settings');
        localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(settings));
        return settings;
    } catch {
        const cached = localStorage.getItem(CACHE_KEYS.SETTINGS);
        if (cached) return JSON.parse(cached);
        return {
            id: 'settings',
            supportPhone: '+91 000 000 0000',
            supportEmail: 'support@serverpro.com',
            address: 'Default Address',
            whatsappNumber: ''
        };
    }
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
    localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(settings));
    try { await apiRequest('/settings', 'POST', settings); } catch {}
};

// --- Generic Helpers ---
export const getPages = async (): Promise<PageContent[]> => {
    try { return await apiRequest('/pages'); } catch { return getCache(CACHE_KEYS.PAGES); }
};
export const savePage = async (page: PageContent): Promise<void> => {
    setCache(CACHE_KEYS.PAGES, [...getCache(CACHE_KEYS.PAGES).filter((p:any)=>p.id!==page.id), page]);
    try { await apiRequest('/pages', 'POST', page); } catch {}
};
export const getPageBySlug = async (slug: string): Promise<PageContent | undefined> => {
    const pages = await getPages();
    return pages.find(p => p.slug === slug);
};
export const deletePage = async (id: string): Promise<void> => {
    setCache(CACHE_KEYS.PAGES, getCache(CACHE_KEYS.PAGES).filter((p:any)=>p.id!==id));
    try { await apiRequest(`/pages/${id}`, 'DELETE'); } catch {}
};

export const getBrands = async (): Promise<Brand[]> => {
    try { return await apiRequest('/brands'); } catch { return getCache(CACHE_KEYS.BRANDS); }
};
export const saveBrand = async (brand: Brand): Promise<void> => {
    setCache(CACHE_KEYS.BRANDS, [...getCache(CACHE_KEYS.BRANDS).filter((b:any)=>b.id!==brand.id), brand]);
    try { await apiRequest('/brands', 'POST', brand); } catch {}
};
export const deleteBrand = async (id: string): Promise<void> => {
    setCache(CACHE_KEYS.BRANDS, getCache(CACHE_KEYS.BRANDS).filter((b:any)=>b.id!==id));
    try { await apiRequest(`/brands/${id}`, 'DELETE'); } catch {}
};

// --- Orders ---
export const createOrder = async (order: any): Promise<Order> => apiRequest('/orders', 'POST', order);
export const getOrders = async (): Promise<Order[]> => {
    try {
        const orders = await apiRequest('/orders');
        return Array.isArray(orders) ? orders : [];
    } catch { return []; }
};
export const updateOrderStatus = async (id: string, status: string): Promise<void> => apiRequest(`/orders/${id}/status`, 'PATCH', { status });
export const deleteOrder = async (id: string): Promise<void> => apiRequest(`/orders/${id}`, 'DELETE');
export const cancelOrder = async (id: string, reason: string): Promise<void> => apiRequest(`/orders/${id}/cancel`, 'PATCH', { reason });
export const getUserOrders = async (userId: string): Promise<Order[]> => {
    const orders = await getOrders();
    return orders.filter(o => o.userId === userId);
};
export const getOrderById = async (id: string): Promise<Order | undefined> => {
    const orders = await getOrders();
    return orders.find(o => o.id === id);
};

// --- Messages ---
export const submitContactMessage = async (msg: any): Promise<void> => {
    try { await apiRequest('/contact', 'POST', msg); } catch {}
};
export const getContactMessages = async (): Promise<ContactMessage[]> => {
    try { return await apiRequest('/contact'); } catch { return []; }
};
export const markMessageRead = async (id: string): Promise<void> => { try { await apiRequest(`/contact/${id}/read`, 'PATCH'); } catch {} };
export const deleteMessage = async (id: string): Promise<void> => { try { await apiRequest(`/contact/${id}`, 'DELETE'); } catch {} };

// --- Auth ---
export const authenticateUser = async (email: string, password: string): Promise<User | undefined> => {
    if (email === 'gyanforindia7@gmail.com' && password === 'Jaimatadi@16@') {
        return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
    }
    return undefined;
};
export const getUsers = async (): Promise<User[]> => { try { return await apiRequest('/users'); } catch { return []; } };
export const saveUser = async (user: User): Promise<void> => { try { await apiRequest('/users', 'POST', user); } catch {} };

// --- Coupons ---
export const getCoupons = async (): Promise<Coupon[]> => { try { return await apiRequest('/coupons'); } catch { return []; } };
export const saveCoupon = async (coupon: Coupon): Promise<void> => { try { await apiRequest('/coupons', 'POST', coupon); } catch {} };
export const deleteCoupon = async (id: string): Promise<void> => { try { await apiRequest(`/coupons/${id}`, 'DELETE'); } catch {} };
export const validateCoupon = async (code: string, total: number): Promise<Coupon | null> => {
    const coupons = await getCoupons();
    return coupons.find(c => c.code === code && c.isActive && (c.minOrderValue || 0) <= total) || null;
};

// --- Blog ---
export const getBlogPosts = async (): Promise<BlogPost[]> => { try { return await apiRequest('/blog'); } catch { return []; } };
export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | undefined> => {
    const posts = await getBlogPosts();
    return posts.find(p => p.slug === slug);
};
export const saveBlogPost = async (post: BlogPost): Promise<void> => { try { await apiRequest('/blog', 'POST', post); } catch {} };
export const deleteBlogPost = async (id: string): Promise<void> => { try { await apiRequest(`/blog/${id}`, 'DELETE'); } catch {} };

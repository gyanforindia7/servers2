
import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * RESILIENT DATABASE SERVICE
 * Redundancy: Backend API -> LocalStorage Cache -> Initial Constants
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
        
        if (!response.ok) {
            console.warn(`API responded with ${response.status} at ${endpoint}`);
            return null;
        }

        // Handle empty or non-json responses
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        }
        return { success: true };
    } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`API call failed to ${endpoint}. Device is likely offline or server is starting.`);
        return null;
    }
};

// --- Local Storage Sync Helpers ---
const CACHE_KEYS = {
    PRODUCTS: 's2_cache_products',
    CATEGORIES: 's2_cache_categories',
    PAGES: 's2_cache_pages',
    QUOTES: 's2_cache_quotes',
    MESSAGES: 's2_cache_messages',
    BRANDS: 's2_cache_brands',
    SETTINGS: 's2_cache_settings'
};

const getCache = (key: string) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
};

const setCache = (key: string, data: any) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount);
};

// --- Products ---
export const getProducts = async (): Promise<Product[]> => {
    try {
        const apiData = await apiRequest('/products/all');
        const cache = getCache(CACHE_KEYS.PRODUCTS);
        const final = (Array.isArray(apiData) && apiData.length > 0) ? apiData : (cache.length > 0 ? cache : INITIAL_PRODUCTS);
        setCache(CACHE_KEYS.PRODUCTS, final);
        return final;
    } catch {
        const cache = getCache(CACHE_KEYS.PRODUCTS);
        return cache.length > 0 ? cache : INITIAL_PRODUCTS;
    }
};

export const saveProduct = async (product: Product): Promise<void> => {
    const cache = getCache(CACHE_KEYS.PRODUCTS);
    const updated = [...cache.filter((p: any) => p.id !== product.id), product];
    setCache(CACHE_KEYS.PRODUCTS, updated);
    await apiRequest(product.id && !product.id.startsWith('p-new') ? `/products/${product.id}` : '/products', product.id && !product.id.startsWith('p-new') ? 'PUT' : 'POST', product);
};

export const deleteProduct = async (id: string): Promise<void> => {
    const cache = getCache(CACHE_KEYS.PRODUCTS);
    setCache(CACHE_KEYS.PRODUCTS, cache.filter((p: any) => p.id !== id));
    await apiRequest(`/products/${id}`, 'DELETE');
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
        const final = Array.isArray(apiData) && apiData.length > 0 ? apiData : (cache.length > 0 ? cache : fallback);
        setCache(CACHE_KEYS.CATEGORIES, final);
        return final;
    } catch {
        return getCache(CACHE_KEYS.CATEGORIES);
    }
};

export const saveCategory = async (cat: Category): Promise<void> => {
    const cache = getCache(CACHE_KEYS.CATEGORIES);
    setCache(CACHE_KEYS.CATEGORIES, [...cache.filter((c: any) => c.id !== cat.id), cat]);
    await apiRequest('/categories', 'POST', cat);
};

export const deleteCategory = async (id: string): Promise<void> => {
    const cache = getCache(CACHE_KEYS.CATEGORIES);
    setCache(CACHE_KEYS.CATEGORIES, cache.filter((c: any) => c.id !== id));
    await apiRequest(`/categories/${id}`, 'DELETE');
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
    const fullQuote = { 
        ...quote, 
        id: `QT-${Date.now()}`, 
        date: new Date().toISOString(), 
        status: 'Pending' 
    };
    
    // SUCCESS FIRST: Save locally so user sees immediate success
    const cache = getCache(CACHE_KEYS.QUOTES);
    setCache(CACHE_KEYS.QUOTES, [fullQuote, ...cache]);
    
    // Background sync: Don't await or throw, just log.
    apiRequest('/quotes', 'POST', quote).then(res => {
        if (!res) console.warn("Quote background sync failed. It will remain in local cache.");
    });
};

export const getQuotes = async (): Promise<QuoteRequest[]> => {
    const apiData = await apiRequest('/quotes');
    const cache = getCache(CACHE_KEYS.QUOTES);
    const combined = [...(Array.isArray(apiData) ? apiData : []), ...cache.filter((c: any) => !apiData?.find((a: any) => a.id === c.id))];
    return combined.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const updateQuoteStatus = async (id: string, status: string): Promise<void> => {
    const cache = getCache(CACHE_KEYS.QUOTES);
    setCache(CACHE_KEYS.QUOTES, cache.map((q: any) => q.id === id ? { ...q, status } : q));
    await apiRequest(`/quotes/${id}/status`, 'PATCH', { status });
};

export const deleteQuote = async (id: string): Promise<void> => {
    const cache = getCache(CACHE_KEYS.QUOTES);
    setCache(CACHE_KEYS.QUOTES, cache.filter((q: any) => q.id !== id));
    await apiRequest(`/quotes/${id}`, 'DELETE');
};

// --- Settings ---
export const getSiteSettings = async (): Promise<SiteSettings> => {
    try {
        const settings = await apiRequest('/settings');
        if (settings) {
            localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(settings));
            return settings;
        }
        throw new Error();
    } catch {
        const cached = localStorage.getItem(CACHE_KEYS.SETTINGS);
        return cached ? JSON.parse(cached) : {
            id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Default Address', whatsappNumber: ''
        };
    }
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
    localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(settings));
    await apiRequest('/settings', 'POST', settings);
};

// --- Pages & CMS ---
export const getPages = async (): Promise<PageContent[]> => {
    const apiData = await apiRequest('/pages');
    if (Array.isArray(apiData)) { setCache(CACHE_KEYS.PAGES, apiData); return apiData; }
    return getCache(CACHE_KEYS.PAGES);
};
export const savePage = async (page: PageContent): Promise<void> => {
    setCache(CACHE_KEYS.PAGES, [...getCache(CACHE_KEYS.PAGES).filter((p:any)=>p.id!==page.id), page]);
    await apiRequest('/pages', 'POST', page);
};
export const getPageBySlug = async (slug: string): Promise<PageContent | undefined> => {
    const pages = await getPages(); return pages.find(p => p.slug === slug);
};
export const deletePage = async (id: string): Promise<void> => {
    setCache(CACHE_KEYS.PAGES, getCache(CACHE_KEYS.PAGES).filter((p:any)=>p.id!==id));
    await apiRequest(`/pages/${id}`, 'DELETE');
};

export const getBrands = async (): Promise<Brand[]> => {
    const apiData = await apiRequest('/brands');
    if (Array.isArray(apiData)) { setCache(CACHE_KEYS.BRANDS, apiData); return apiData; }
    return getCache(CACHE_KEYS.BRANDS);
};
export const saveBrand = async (brand: Brand): Promise<void> => {
    setCache(CACHE_KEYS.BRANDS, [...getCache(CACHE_KEYS.BRANDS).filter((b:any)=>b.id!==brand.id), brand]);
    await apiRequest('/brands', 'POST', brand);
};
export const deleteBrand = async (id: string): Promise<void> => {
    setCache(CACHE_KEYS.BRANDS, getCache(CACHE_KEYS.BRANDS).filter((b:any)=>b.id!==id));
    await apiRequest(`/brands/${id}`, 'DELETE');
};

// --- Orders ---
export const createOrder = async (order: any): Promise<Order> => {
    const res = await apiRequest('/orders', 'POST', order);
    return res || { ...order, id: `ORD-${Date.now()}` };
};
export const getOrders = async (): Promise<Order[]> => {
    const orders = await apiRequest('/orders');
    return Array.isArray(orders) ? orders : [];
};
export const updateOrderStatus = async (id: string, status: string): Promise<void> => apiRequest(`/orders/${id}/status`, 'PATCH', { status });
export const deleteOrder = async (id: string): Promise<void> => apiRequest(`/orders/${id}`, 'DELETE');
export const cancelOrder = async (id: string, reason: string): Promise<void> => apiRequest(`/orders/${id}/cancel`, 'PATCH', { reason });
export const getUserOrders = async (userId: string): Promise<Order[]> => {
    const orders = await getOrders(); return orders.filter(o => o.userId === userId);
};
export const getOrderById = async (id: string): Promise<Order | undefined> => {
    const orders = await getOrders(); return orders.find(o => o.id === id);
};

// --- Contact Messages ---
export const submitContactMessage = async (msg: any): Promise<void> => {
    apiRequest('/contact', 'POST', msg); // Fire and forget for optimistic UI
};
export const getContactMessages = async (): Promise<ContactMessage[]> => {
    const msgs = await apiRequest('/contact'); return Array.isArray(msgs) ? msgs : [];
};
export const markMessageRead = async (id: string): Promise<void> => apiRequest(`/contact/${id}/read`, 'PATCH');
export const deleteMessage = async (id: string): Promise<void> => apiRequest(`/contact/${id}`, 'DELETE');

// --- Auth ---
export const authenticateUser = async (email: string, password: string): Promise<User | undefined> => {
    if (email === 'gyanforindia7@gmail.com' && password === 'Jaimatadi@16@') {
        return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
    }
    return undefined;
};
export const getUsers = async (): Promise<User[]> => { const users = await apiRequest('/users'); return Array.isArray(users) ? users : []; };
export const saveUser = async (user: User): Promise<void> => { apiRequest('/users', 'POST', user); };

// --- Coupons ---
export const getCoupons = async (): Promise<Coupon[]> => { const coupons = await apiRequest('/coupons'); return Array.isArray(coupons) ? coupons : []; };
export const saveCoupon = async (coupon: Coupon): Promise<void> => { apiRequest('/coupons', 'POST', coupon); };
export const deleteCoupon = async (id: string): Promise<void> => { apiRequest(`/coupons/${id}`, 'DELETE'); };
export const validateCoupon = async (code: string, total: number): Promise<Coupon | null> => {
    const coupons = await getCoupons();
    return coupons.find(c => c.code === code && c.isActive && (c.minOrderValue || 0) <= total) || null;
};

// --- Blog ---
export const getBlogPosts = async (): Promise<BlogPost[]> => { const posts = await apiRequest('/blog'); return Array.isArray(posts) ? posts : []; };
export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | undefined> => {
    const posts = await getBlogPosts(); return posts.find(p => p.slug === slug);
};
export const saveBlogPost = async (post: BlogPost): Promise<void> => { apiRequest('/blog', 'POST', post); };
export const deleteBlogPost = async (id: string): Promise<void> => { apiRequest(`/blog/${id}`, 'DELETE'); };

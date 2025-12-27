import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * ULTRA-FAST DATABASE SERVICE
 * Returns data from Memory -> LocalStorage -> API (Background Sync)
 */

const API_URL = '/api';

// In-memory session cache to avoid repeated JSON parsing
const MEM_CACHE: Record<string, any> = {};

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s is plenty
    
    try {
        const response = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, { 
            method, 
            headers,
            signal: controller.signal,
            body: body ? JSON.stringify(body) : undefined
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) return null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return { success: true };
    } catch (err) {
        clearTimeout(timeoutId);
        return null;
    }
};

const CACHE_KEYS = {
    PRODUCTS: 's2_cache_products',
    CATEGORIES: 's2_cache_categories',
    PAGES: 's2_cache_pages',
    QUOTES: 's2_cache_quotes',
    MESSAGES: 's2_cache_messages',
    BRANDS: 's2_cache_brands',
    SETTINGS: 's2_cache_settings'
};

const getPersisted = (key: string) => {
    if (MEM_CACHE[key]) return MEM_CACHE[key];
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            MEM_CACHE[key] = parsed;
            return parsed;
        }
    } catch (e) {}
    return null;
};

const setPersisted = (key: string, data: any) => {
    MEM_CACHE[key] = data;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount);
};

// --- Generic Instant-Return Wrapper ---
const fetchWithCache = async <T>(key: string, endpoint: string, fallback: T): Promise<T> => {
    const cached = getPersisted(key);
    
    // Background update (don't await)
    apiRequest(endpoint).then(freshData => {
        if (freshData && Array.isArray(freshData) && freshData.length > 0) {
            setPersisted(key, freshData);
        } else if (freshData && !Array.isArray(freshData) && typeof freshData === 'object') {
             setPersisted(key, freshData);
        }
    });

    return cached || fallback;
};

// --- Products ---
export const getProducts = async (): Promise<Product[]> => {
    return fetchWithCache(CACHE_KEYS.PRODUCTS, '/products/all', INITIAL_PRODUCTS);
};

export const saveProduct = async (product: Product): Promise<void> => {
    const current = await getProducts();
    const updated = [...current.filter((p: any) => p.id !== product.id), product];
    setPersisted(CACHE_KEYS.PRODUCTS, updated);
    apiRequest(product.id && !product.id.startsWith('p-new') ? `/products/${product.id}` : '/products', product.id && !product.id.startsWith('p-new') ? 'PUT' : 'POST', product);
};

export const deleteProduct = async (id: string): Promise<void> => {
    const current = await getProducts();
    setPersisted(CACHE_KEYS.PRODUCTS, current.filter((p: any) => p.id !== id));
    apiRequest(`/products/${id}`, 'DELETE');
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
    return fetchWithCache(CACHE_KEYS.CATEGORIES, '/categories', fallback);
};

export const saveCategory = async (cat: Category): Promise<void> => {
    const current = await getCategories();
    setPersisted(CACHE_KEYS.CATEGORIES, [...current.filter((c: any) => c.id !== cat.id), cat]);
    apiRequest('/categories', 'POST', cat);
};

export const deleteCategory = async (id: string): Promise<void> => {
    const current = await getCategories();
    setPersisted(CACHE_KEYS.CATEGORIES, current.filter((c: any) => c.id !== id));
    apiRequest(`/categories/${id}`, 'DELETE');
};

export const getCategoryBySlug = async (slug: string): Promise<Category | undefined> => {
    const cats = await getCategories();
    return cats.find(c => c.slug === slug);
};

export const getCategoryHierarchy = async (): Promise<Category[]> => {
    const all = await getCategories();
    return all.filter(c => !c.parentId);
};

// --- Settings ---
export const getSiteSettings = async (): Promise<SiteSettings> => {
    const defaultSettings: SiteSettings = {
        id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Default Address', whatsappNumber: ''
    };
    
    const cached = getPersisted(CACHE_KEYS.SETTINGS);
    
    // Background update
    apiRequest('/settings').then(fresh => {
        if (fresh && fresh.id) setPersisted(CACHE_KEYS.SETTINGS, fresh);
    });

    return cached || defaultSettings;
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
    setPersisted(CACHE_KEYS.SETTINGS, settings);
    apiRequest('/settings', 'POST', settings);
};

// --- Quotes ---
export const submitQuote = async (quote: any): Promise<void> => {
    const fullQuote = { ...quote, id: `QT-${Date.now()}`, date: new Date().toISOString(), status: 'Pending' };
    const current = getPersisted(CACHE_KEYS.QUOTES) || [];
    setPersisted(CACHE_KEYS.QUOTES, [fullQuote, ...current]);
    apiRequest('/quotes', 'POST', quote);
};

export const getQuotes = async (): Promise<QuoteRequest[]> => {
    return fetchWithCache(CACHE_KEYS.QUOTES, '/quotes', []);
};

export const updateQuoteStatus = async (id: string, status: string): Promise<void> => {
    const current = await getQuotes();
    setPersisted(CACHE_KEYS.QUOTES, current.map((q: any) => q.id === id ? { ...q, status } : q));
    apiRequest(`/quotes/${id}/status`, 'PATCH', { status });
};

export const deleteQuote = async (id: string): Promise<void> => {
    const current = await getQuotes();
    setPersisted(CACHE_KEYS.QUOTES, current.filter((q: any) => q.id !== id));
    apiRequest(`/quotes/${id}`, 'DELETE');
};

// --- Remaining API methods use instant response pattern ---
export const getPages = async (): Promise<PageContent[]> => fetchWithCache(CACHE_KEYS.PAGES, '/pages', []);
export const savePage = async (page: PageContent): Promise<void> => {
    const current = await getPages();
    setPersisted(CACHE_KEYS.PAGES, [...current.filter(p => p.id !== page.id), page]);
    apiRequest('/pages', 'POST', page);
};
export const getPageBySlug = async (slug: string) => (await getPages()).find(p => p.slug === slug);
export const deletePage = async (id: string) => {
    const current = await getPages();
    setPersisted(CACHE_KEYS.PAGES, current.filter(p => p.id !== id));
    apiRequest(`/pages/${id}`, 'DELETE');
};

export const getBrands = async (): Promise<Brand[]> => fetchWithCache(CACHE_KEYS.BRANDS, '/brands', []);
export const saveBrand = async (brand: Brand): Promise<void> => {
    const current = await getBrands();
    setPersisted(CACHE_KEYS.BRANDS, [...current.filter(b => b.id !== brand.id), brand]);
    apiRequest('/brands', 'POST', brand);
};
export const deleteBrand = async (id: string) => {
    const current = await getBrands();
    setPersisted(CACHE_KEYS.BRANDS, current.filter(b => b.id !== id));
    apiRequest(`/brands/${id}`, 'DELETE');
};

export const createOrder = async (order: any): Promise<Order> => {
    const res = await apiRequest('/orders', 'POST', order);
    return res || { ...order, id: `ORD-${Date.now()}` };
};
export const getOrders = async (): Promise<Order[]> => {
    const res = await apiRequest('/orders');
    return Array.isArray(res) ? res : [];
};
export const updateOrderStatus = (id: string, status: string) => apiRequest(`/orders/${id}/status`, 'PATCH', { status });
export const deleteOrder = (id: string) => apiRequest(`/orders/${id}`, 'DELETE');
export const cancelOrder = (id: string, reason: string) => apiRequest(`/orders/${id}/cancel`, 'PATCH', { reason });
export const getUserOrders = async (userId: string) => (await getOrders()).filter(o => o.userId === userId);
export const getOrderById = async (id: string) => (await getOrders()).find(o => o.id === id);

export const submitContactMessage = async (msg: any) => {
    const current = getPersisted(CACHE_KEYS.MESSAGES) || [];
    const newMsg = { ...msg, id: `MSG-${Date.now()}`, date: new Date().toISOString(), status: 'New' };
    setPersisted(CACHE_KEYS.MESSAGES, [newMsg, ...current]);
    apiRequest('/contact', 'POST', msg);
};
export const getContactMessages = async (): Promise<ContactMessage[]> => fetchWithCache(CACHE_KEYS.MESSAGES, '/contact', []);
export const markMessageRead = async (id: string) => {
    const current = await getContactMessages();
    setPersisted(CACHE_KEYS.MESSAGES, current.map(m => m.id === id ? { ...m, status: 'Read' } : m));
    apiRequest(`/contact/${id}/read`, 'PATCH');
};
export const deleteMessage = async (id: string) => {
    const current = await getContactMessages();
    setPersisted(CACHE_KEYS.MESSAGES, current.filter(m => m.id !== id));
    apiRequest(`/contact/${id}`, 'DELETE');
};

export const authenticateUser = async (email: string, password: string): Promise<User | undefined> => {
    if (email === 'gyanforindia7@gmail.com' && password === 'Jaimatadi@16@') {
        return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
    }
    return undefined;
};
export const getUsers = async (): Promise<User[]> => { const res = await apiRequest('/users'); return Array.isArray(res) ? res : []; };
export const saveUser = async (user: User) => apiRequest('/users', 'POST', user);

export const getCoupons = async (): Promise<Coupon[]> => { const res = await apiRequest('/coupons'); return Array.isArray(res) ? res : []; };
export const saveCoupon = async (coupon: Coupon) => apiRequest('/coupons', 'POST', coupon);
export const deleteCoupon = async (id: string) => apiRequest(`/coupons/${id}`, 'DELETE');
export const validateCoupon = async (code: string, total: number) => {
    const coupons = await getCoupons();
    return coupons.find(c => c.code === code && c.isActive && (c.minOrderValue || 0) <= total) || null;
};

export const getBlogPosts = async (): Promise<BlogPost[]> => { const res = await apiRequest('/blog'); return Array.isArray(res) ? res : []; };
export const getBlogPostBySlug = async (slug: string) => (await getBlogPosts()).find(p => p.slug === slug);
export const saveBlogPost = async (post: BlogPost) => apiRequest('/blog', 'POST', post);
export const deleteBlogPost = async (id: string) => apiRequest(`/blog/${id}`, 'DELETE');

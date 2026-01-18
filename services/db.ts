import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * ULTRA-FAST DATABASE SERVICE
 * Optimized for real-time saving and cross-device consistency.
 */

const API_URL = '/api';
const MEM_CACHE: Record<string, any> = {};
let lastWriteTimestamp = 0; // Tracks last change to avoid stale background syncs

export const STABLE_KEYS = {
    PRODUCTS: 's2_stable_products',
    CATEGORIES: 's2_stable_categories',
    PAGES: 's2_stable_pages',
    SETTINGS: 's2_stable_settings',
    BRANDS: 's2_stable_brands'
};

/**
 * RECURSIVE Deep Clean
 * Removes _id and __v from all nested levels of an object.
 */
const deepCleanForServer = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(deepCleanForServer);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (key !== '_id' && key !== '__v') {
                newObj[key] = deepCleanForServer(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

// Helper for immediate UI bootstrap
export const getCategoryDefaults = (): Category[] => {
    return INITIAL_CATEGORY_NAMES.map((name, i) => ({
        id: `cat-default-${i}`, 
        name, 
        slug: name.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'), 
        showInMenu: true, 
        showOnHome: true, 
        sortOrder: i
    }));
};

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); 
        
        // Cache busting ONLY for GET requests
        const urlSeparator = endpoint.includes('?') ? '&' : '?';
        const finalUrl = method === 'GET' 
            ? `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}${urlSeparator}_t=${Date.now()}`
            : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

        const payload = body ? deepCleanForServer(body) : undefined;

        const response = await fetch(finalUrl, { 
            method, 
            headers: { 'Content-Type': 'application/json' },
            body: payload ? JSON.stringify(payload) : undefined,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.error(`API Error [${method} ${endpoint}]: Status ${response.status}`);
            return null;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return { success: true };
    } catch (err) {
        console.error(`Network Failure [${method} ${endpoint}]:`, err);
        return null;
    }
};

export const getCacheSync = <T>(key: string, fallback: T): T => {
    if (MEM_CACHE[key]) return MEM_CACHE[key];
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed) {
                MEM_CACHE[key] = parsed;
                return parsed as T;
            }
        }
    } catch (e) {}
    return fallback;
};

const setPersisted = (key: string, data: any) => {
    MEM_CACHE[key] = data;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
};

/**
 * fetchLive
 * Prioritizes consistency for Admin actions.
 */
const fetchLive = async <T>(key: string, endpoint: string, fallback: T): Promise<T> => {
    const cached = getCacheSync(key, null);
    
    const syncWithServer = async (): Promise<T | null> => {
        // PREVENT RACE CONDITION: If we just saved something, wait 10s before background syncing
        // This ensures the DB has time to reflect the new state to the GET endpoint.
        if (Date.now() - lastWriteTimestamp < 10000) {
            return null;
        }

        const freshData = await apiRequest(endpoint);
        if (freshData !== null) {
            setPersisted(key, freshData);
            return freshData as unknown as T;
        }
        return null;
    };

    if (cached) {
        syncWithServer(); // Try syncing in background
        return cached as unknown as T;
    }

    const fresh = await syncWithServer();
    return fresh !== null ? fresh : fallback;
};

// --- READ OPERATIONS ---

export const getProducts = async (): Promise<Product[]> => fetchLive(STABLE_KEYS.PRODUCTS, '/products/all', INITIAL_PRODUCTS);
export const getCategories = async (): Promise<Category[]> => fetchLive(STABLE_KEYS.CATEGORIES, '/categories', getCategoryDefaults());
export const getPages = async (): Promise<PageContent[]> => fetchLive(STABLE_KEYS.PAGES, '/pages', []);
export const getSiteSettings = async (): Promise<SiteSettings> => {
    const defaults: SiteSettings = { id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Enterprise Hub, India', whatsappNumber: '' };
    return fetchLive(STABLE_KEYS.SETTINGS, '/settings', defaults);
};
export const getBrands = async (): Promise<Brand[]> => fetchLive(STABLE_KEYS.BRANDS, '/brands', []);

// --- WRITE OPERATIONS ---

export const saveProduct = async (product: Product): Promise<void> => {
    lastWriteTimestamp = Date.now();
    const idToUse = product.id || `p-${Date.now()}`;
    const cleanProduct = { ...product, id: idToUse };
    
    const result = await apiRequest(product.id ? `/products/${idToUse}` : '/products', product.id ? 'PUT' : 'POST', cleanProduct);
    
    if (result) {
        const current = getCacheSync<Product[]>(STABLE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        // Use result from server to ensure we have the correct DB representation
        const updatedList = [...current.filter(p => p.id !== idToUse), result];
        setPersisted(STABLE_KEYS.PRODUCTS, updatedList);
    } else {
        throw new Error("Server communication failed. Change not saved.");
    }
};

export const saveCategory = async (cat: Category): Promise<void> => {
    lastWriteTimestamp = Date.now();
    const idToUse = cat.id || `cat-${Date.now()}`;
    const result = await apiRequest('/categories', 'POST', { ...cat, id: idToUse });
    if (result) {
        const current = getCacheSync<Category[]>(STABLE_KEYS.CATEGORIES, getCategoryDefaults());
        setPersisted(STABLE_KEYS.CATEGORIES, [...current.filter(c => c.id !== idToUse), result]);
    }
};

export const deleteProduct = async (id: string) => { 
    lastWriteTimestamp = Date.now();
    const result = await apiRequest(`/products/${id}`, 'DELETE'); 
    if (result) {
        const current = getCacheSync<Product[]>(STABLE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
        setPersisted(STABLE_KEYS.PRODUCTS, current.filter(p => p.id !== id)); 
    }
};

export const deleteCategory = async (id: string) => { 
    lastWriteTimestamp = Date.now();
    const result = await apiRequest(`/categories/${id}`, 'DELETE'); 
    if (result) {
        const current = getCacheSync<Category[]>(STABLE_KEYS.CATEGORIES, getCategoryDefaults());
        setPersisted(STABLE_KEYS.CATEGORIES, current.filter(c => c.id !== id)); 
    }
};

// --- UTILITIES ---
export const getProductBySlug = async (slug: string) => (await getProducts()).find(p => p.slug === slug);
export const getCategoryBySlug = async (slug: string) => (await getCategories()).find(c => c.slug === slug);
export const getSimilarProducts = async (product: Product): Promise<Product[]> => {
    const all = await getProducts();
    return all.filter(p => p.category === product.category && p.id !== product.id).slice(0, 5);
};
export const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
export const getOrders = async () => (await apiRequest('/orders')) || [];
export const createOrder = async (order: any) => apiRequest('/orders', 'POST', order);
export const getQuotes = async () => (await apiRequest('/quotes')) || [];
export const submitQuote = async (quote: any) => apiRequest('/quotes', 'POST', quote);
export const getContactMessages = async () => (await apiRequest('/contact')) || [];
export const submitContactMessage = async (msg: any) => apiRequest('/contact', 'POST', msg);
export const getUsers = async (): Promise<User[]> => (await apiRequest('/users')) || [];
export const saveUser = async (user: User) => apiRequest('/users', 'POST', user);

export const authenticateUser = async (email: string, password: string): Promise<User | undefined> => {
    if (email === 'gyanforindia7@gmail.com' && password === 'Jaimatadi@16@') return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
    const users = await getUsers();
    return users.find(u => u.email === email && u.password === password);
};

export const updateOrderStatus = (id: string, status: string) => apiRequest(`/orders/${id}`, 'PUT', { status });
export const updateQuoteStatus = (id: string, status: string) => apiRequest(`/quotes/${id}/status`, 'POST', { status });
export const deleteOrder = async (id: string) => apiRequest(`/orders/${id}`, 'DELETE');
export const deleteQuote = async (id: string) => apiRequest(`/quotes/${id}`, 'DELETE');
export const deleteMessage = async (id: string) => apiRequest(`/contact/${id}`, 'DELETE');
export const markMessageRead = (id: string) => apiRequest(`/contact/${id}/read`, 'POST');
export const validateCoupon = async (code: string, total: number) => ((await apiRequest('/coupons')) || []).find((c: any) => c.code === code && c.isActive && (c.minOrderValue || 0) <= total) || null;
export const getBlogPosts = async () => (await apiRequest('/blog')) || [];
export const getBlogPostBySlug = async (slug: string) => (await getBlogPosts()).find((p: any) => p.slug === slug);
export const saveBlogPost = async (post: BlogPost) => { lastWriteTimestamp = Date.now(); return apiRequest('/blog', 'POST', post); };
export const deleteBlogPost = async (id: string) => { lastWriteTimestamp = Date.now(); return apiRequest(`/blog/${id}`, 'DELETE'); };
export const getCoupons = async () => (await apiRequest('/coupons')) || [];
export const saveCoupon = async (coupon: Coupon) => { lastWriteTimestamp = Date.now(); return apiRequest('/coupons', 'POST', coupon); };
export const deleteCoupon = async (id: string) => { lastWriteTimestamp = Date.now(); return apiRequest(`/coupons/${id}`, 'DELETE'); };
export const cancelOrder = (id: string, reason: string) => apiRequest(`/orders/${id}/cancel`, 'POST', { reason });
export const getUserOrders = async (userId: string) => (await getOrders()).filter((o: any) => o.userId === userId);
export const getOrderById = async (id: string) => (await getOrders()).find((o: any) => o.id === id);
export const saveSiteSettings = async (settings: SiteSettings) => { lastWriteTimestamp = Date.now(); const res = await apiRequest('/settings', 'POST', settings); if (res) setPersisted(STABLE_KEYS.SETTINGS, res); };
export const saveBrand = async (brand: Brand) => { lastWriteTimestamp = Date.now(); const result = await apiRequest('/brands', 'POST', brand); if (result) { const current = getCacheSync<Brand[]>(STABLE_KEYS.BRANDS, []); setPersisted(STABLE_KEYS.BRANDS, [...current.filter(b => b.id !== brand.id), result]); } };
export const deleteBrand = async (id: string) => { lastWriteTimestamp = Date.now(); const result = await apiRequest(`/brands/${id}`, 'DELETE'); if (result) { setPersisted(STABLE_KEYS.BRANDS, getCacheSync<Brand[]>(STABLE_KEYS.BRANDS, []).filter(b => b.id !== id)); } };
export const savePage = async (page: PageContent) => { lastWriteTimestamp = Date.now(); const result = await apiRequest('/pages', 'POST', page); if (result) { const current = getCacheSync<PageContent[]>(STABLE_KEYS.PAGES, []); setPersisted(STABLE_KEYS.PAGES, [...current.filter(p => p.id !== page.id), result]); } };
export const deletePage = async (id: string) => { lastWriteTimestamp = Date.now(); const result = await apiRequest(`/pages/${id}`, 'DELETE'); if (result) { setPersisted(STABLE_KEYS.PAGES, getCacheSync<PageContent[]>(STABLE_KEYS.PAGES, []).filter(p => p.id !== id)); } };
export const getPageBySlug = async (slug: string) => (await getPages()).find(p => p.slug === slug);
export const clearAllCache = () => { Object.keys(MEM_CACHE).forEach(k => delete MEM_CACHE[k]); Object.values(STABLE_KEYS).forEach(k => localStorage.removeItem(k)); };

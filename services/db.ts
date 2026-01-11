import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * PRODUCTION DATABASE SERVICE
 * Optimized for immediate visibility of changes across all devices and Incognito mode.
 * Fixed: Distinguishes between 'empty database' and 'failed server connection'.
 */

const API_URL = '/api';

// In-memory cache for the current session to avoid unnecessary storage hits
const MEM_CACHE: Record<string, any> = {};

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    
    try {
        const response = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, { 
            method, 
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        
        // If server returns an error code, return null to signify failure
        if (!response.ok) {
            console.error(`Server responded with ${response.status} for ${endpoint}`);
            return null;
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return { success: true };
    } catch (err) {
        // Signify network failure
        console.error(`Network request failed for: ${endpoint}`, err);
        return null;
    }
};

const CACHE_KEYS = {
    PRODUCTS: 's2_cache_products_v5',
    CATEGORIES: 's2_cache_categories_v5',
    PAGES: 's2_cache_pages_v5',
    QUOTES: 's2_cache_quotes_v5',
    MESSAGES: 's2_cache_messages_v5',
    BRANDS: 's2_cache_brands_v5',
    SETTINGS: 's2_cache_settings_v5'
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

export const clearAllCache = () => {
    Object.keys(MEM_CACHE).forEach(key => delete MEM_CACHE[key]);
    Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key));
    console.log('Cache cleared successfully.');
};

// --- Corrected Fetcher: Trust Server First ---
const fetchLive = async <T>(key: string, endpoint: string, fallback: T): Promise<T> => {
    const freshData = await apiRequest(endpoint);
    
    // CRITICAL FIX: If the server responded with ANY valid data (even an empty array []),
    // we must treat it as the absolute truth and update our cache.
    if (freshData !== null) {
        setPersisted(key, freshData);
        
        // If the result is an empty array, it means the DB is empty. 
        // We only use the 'fallback' if this is the very first time the app is run
        // OR if the result is truly undefined.
        if (Array.isArray(freshData)) {
            return freshData as unknown as T;
        }
        return freshData;
    }

    // Only if the API request FAILED (null), do we check the local device cache
    const cached = getPersisted(key);
    if (cached) return cached;

    // Finally, if no server and no cache, use hardcoded constants
    return fallback;
};

export const getProducts = async (): Promise<Product[]> => {
    return fetchLive(CACHE_KEYS.PRODUCTS, '/products/all', INITIAL_PRODUCTS);
};

export const saveProduct = async (product: Product): Promise<void> => {
    const idToUse = product.id && !product.id.startsWith('p-new') ? product.id : `p-${Date.now()}`;
    const cleanProduct = { ...product, id: idToUse };
    
    const isNew = !product.id || product.id.startsWith('p-new');
    const result = await apiRequest(isNew ? '/products' : `/products/${idToUse}`, isNew ? 'POST' : 'PUT', cleanProduct);
    
    if (result) {
        // Force refresh local cache after successful save
        const all = await getProducts();
        const updated = [...all.filter(p => p.id !== idToUse), cleanProduct];
        setPersisted(CACHE_KEYS.PRODUCTS, updated);
    } else {
        throw new Error("Unable to reach the backend server to save your product.");
    }
};

export const deleteProduct = async (id: string): Promise<void> => {
    const success = await apiRequest(`/products/${id}`, 'DELETE');
    if (success) {
        const current = await getProducts();
        setPersisted(CACHE_KEYS.PRODUCTS, current.filter(p => p.id !== id));
    }
};

export const getCategories = async (): Promise<Category[]> => {
    return fetchLive(CACHE_KEYS.CATEGORIES, '/categories', []);
};

export const saveCategory = async (cat: Category): Promise<void> => {
    const result = await apiRequest('/categories', 'POST', cat);
    if (result) {
        const current = await getCategories();
        setPersisted(CACHE_KEYS.CATEGORIES, [...current.filter(c => c.id !== cat.id), cat]);
    }
};

export const deleteCategory = async (id: string): Promise<void> => {
    await apiRequest(`/categories/${id}`, 'DELETE');
    const current = await getCategories();
    setPersisted(CACHE_KEYS.CATEGORIES, current.filter(c => c.id !== id));
};

export const getSiteSettings = async (): Promise<SiteSettings> => {
    const defaults: SiteSettings = {
        id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Default Address', whatsappNumber: ''
    };
    return fetchLive(CACHE_KEYS.SETTINGS, '/settings', defaults);
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
    const result = await apiRequest('/settings', 'POST', settings);
    if (result) setPersisted(CACHE_KEYS.SETTINGS, settings);
};

// --- Helpers ---
export const getProductBySlug = async (slug: string) => (await getProducts()).find(p => p.slug === slug);
export const getProductsByCategory = async (categoryName: string) => (await getProducts()).filter(p => p.category === categoryName && p.isActive !== false);
export const getSimilarProducts = async (product: Product) => (await getProducts()).filter(p => p.category === product.category && p.id !== product.id && p.isActive !== false).slice(0, 5);
export const getCategoryBySlug = async (slug: string) => (await getCategories()).find(c => c.slug === slug);
export const getPages = async (): Promise<PageContent[]> => fetchLive(CACHE_KEYS.PAGES, '/pages', []);
export const savePage = async (page: PageContent) => { await apiRequest('/pages', 'POST', page); const c = await getPages(); setPersisted(CACHE_KEYS.PAGES, [...c.filter(p => p.id !== page.id), page]); };
export const deletePage = async (id: string) => { await apiRequest(`/pages/${id}`, 'DELETE'); const c = await getPages(); setPersisted(CACHE_KEYS.PAGES, c.filter(p => p.id !== id)); };
export const getPageBySlug = async (slug: string) => (await getPages()).find(p => p.slug === slug);
export const getBrands = async (): Promise<Brand[]> => fetchLive(CACHE_KEYS.BRANDS, '/brands', []);
export const saveBrand = async (brand: Brand) => { await apiRequest('/brands', 'POST', brand); const c = await getBrands(); setPersisted(CACHE_KEYS.BRANDS, [...c.filter(b => b.id !== brand.id), brand]); };
export const deleteBrand = async (id: string) => { await apiRequest(`/brands/${id}`, 'DELETE'); const c = await getBrands(); setPersisted(CACHE_KEYS.BRANDS, c.filter(b => b.id !== id)); };
export const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
export const createOrder = async (order: any) => apiRequest('/orders', 'POST', order);
export const getOrders = async () => apiRequest('/orders') || [];
export const updateOrderStatus = (id: string, status: string) => apiRequest(`/orders/${id}`, 'PUT', { status });
export const deleteOrder = (id: string) => apiRequest(`/orders/${id}`, 'DELETE');
export const cancelOrder = (id: string, reason: string) => apiRequest(`/orders/${id}/cancel`, 'POST', { reason });
export const getUserOrders = async (userId: string) => (await getOrders()).filter((o: any) => o.userId === userId);
export const getOrderById = async (id: string) => (await getOrders()).find((o: any) => o.id === id);
export const submitContactMessage = async (msg: any) => apiRequest('/contact', 'POST', msg);
export const getContactMessages = async () => apiRequest('/contact') || [];
export const markMessageRead = async (id: string) => apiRequest(`/contact/${id}/read`, 'POST');
export const deleteMessage = async (id: string) => apiRequest(`/contact/${id}`, 'DELETE');
export const getCoupons = async () => apiRequest('/coupons') || [];
export const saveCoupon = async (coupon: Coupon) => apiRequest('/coupons', 'POST', coupon);
export const deleteCoupon = async (id: string) => apiRequest(`/coupons/${id}`, 'DELETE');
export const validateCoupon = async (code: string, total: number) => (await getCoupons()).find((c: any) => c.code === code && c.isActive && (c.minOrderValue || 0) <= total) || null;
export const getBlogPosts = async () => apiRequest('/blog') || [];
export const getBlogPostBySlug = async (slug: string) => (await getBlogPosts()).find((p: any) => p.slug === slug);
export const saveBlogPost = async (post: BlogPost) => apiRequest('/blog', 'POST', post);
export const deleteBlogPost = async (id: string) => apiRequest(`/blog/${id}`, 'DELETE');
export const getQuotes = async () => apiRequest('/quotes') || [];
export const submitQuote = async (quote: any) => apiRequest('/quotes', 'POST', quote);
export const updateQuoteStatus = (id: string, status: string) => apiRequest(`/quotes/${id}/status`, 'POST', { status });
export const deleteQuote = (id: string) => apiRequest(`/quotes/${id}`, 'DELETE');

export const getUsers = async (): Promise<User[]> => (await apiRequest('/users')) || [];
export const saveUser = async (user: User) => apiRequest('/users', 'POST', user);

export const authenticateUser = async (email: string, password: string): Promise<User | undefined> => {
    if (email === 'gyanforindia7@gmail.com' && password === 'Jaimatadi@16@') return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
    const users = await getUsers();
    return users.find(u => u.email === email && u.password === password);
};
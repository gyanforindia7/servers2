import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * PRODUCTION DATABASE SERVICE
 * Optimized for immediate visibility of changes across all devices.
 */

const API_URL = '/api';

// In-memory session cache to avoid repeated JSON parsing
const MEM_CACHE: Record<string, any> = {};

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    
    try {
        const response = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, { 
            method, 
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        
        if (!response.ok) return null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return { success: true };
    } catch (err) {
        console.error(`API Request Failed: ${endpoint}`, err);
        return null;
    }
};

const CACHE_KEYS = {
    PRODUCTS: 's2_cache_products_v3',
    CATEGORIES: 's2_cache_categories_v3',
    PAGES: 's2_cache_pages_v3',
    QUOTES: 's2_cache_quotes_v3',
    MESSAGES: 's2_cache_messages_v3',
    BRANDS: 's2_cache_brands_v3',
    SETTINGS: 's2_cache_settings_v3'
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

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount);
};

// --- Smart Fetcher: API Priority ---
const fetchWithPriority = async <T>(key: string, endpoint: string, fallback: T): Promise<T> => {
    const cached = getPersisted(key);
    
    // If we have nothing in cache (Incognito), we MUST wait for the API
    if (!cached) {
        const freshData = await apiRequest(endpoint);
        if (freshData && (Array.isArray(freshData) ? freshData.length > 0 : !!freshData)) {
            setPersisted(key, freshData);
            return freshData;
        }
        return fallback;
    }

    // If we have cache, return it but update in background
    apiRequest(endpoint).then(freshData => {
        if (freshData) setPersisted(key, freshData);
    });

    return cached;
};

// --- Products ---
export const getProducts = async (): Promise<Product[]> => {
    return fetchWithPriority(CACHE_KEYS.PRODUCTS, '/products/all', INITIAL_PRODUCTS);
};

export const saveProduct = async (product: Product): Promise<void> => {
    // Generate ID if missing
    const idToUse = product.id || `p-${Date.now()}`;
    const cleanProduct = { ...product, id: idToUse };
    
    // 1. Persist to API first
    const isNew = !product.id || product.id.startsWith('p-new');
    const result = await apiRequest(isNew ? '/products' : `/products/${product.id}`, isNew ? 'POST' : 'PUT', cleanProduct);
    
    if (result) {
        // 2. Update local cache only on success
        const current = await getProducts();
        const updated = [...current.filter((p: any) => p.id !== idToUse), cleanProduct];
        setPersisted(CACHE_KEYS.PRODUCTS, updated);
    } else {
        throw new Error("Failed to save product to server database.");
    }
};

export const deleteProduct = async (id: string): Promise<void> => {
    const success = await apiRequest(`/products/${id}`, 'DELETE');
    if (success) {
        const current = await getProducts();
        setPersisted(CACHE_KEYS.PRODUCTS, current.filter((p: any) => p.id !== id));
    }
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
    return fetchWithPriority(CACHE_KEYS.CATEGORIES, '/categories', []);
};

export const saveCategory = async (cat: Category): Promise<void> => {
    const result = await apiRequest('/categories', 'POST', cat);
    if (result) {
        const current = await getCategories();
        setPersisted(CACHE_KEYS.CATEGORIES, [...current.filter((c: any) => c.id !== cat.id), cat]);
    }
};

export const deleteCategory = async (id: string): Promise<void> => {
    const success = await apiRequest(`/categories/${id}`, 'DELETE');
    if (success) {
        const current = await getCategories();
        setPersisted(CACHE_KEYS.CATEGORIES, current.filter((c: any) => c.id !== id));
    }
};

export const getCategoryBySlug = async (slug: string): Promise<Category | undefined> => {
    const cats = await getCategories();
    return cats.find(c => c.slug === slug);
};

// --- Settings ---
export const getSiteSettings = async (): Promise<SiteSettings> => {
    const defaultSettings: SiteSettings = {
        id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Default Address', whatsappNumber: ''
    };
    return fetchWithPriority(CACHE_KEYS.SETTINGS, '/settings', defaultSettings);
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
    const result = await apiRequest('/settings', 'POST', settings);
    if (result) setPersisted(CACHE_KEYS.SETTINGS, settings);
};

// --- Helper Functions ---
export const getPages = async (): Promise<PageContent[]> => fetchWithPriority(CACHE_KEYS.PAGES, '/pages', []);
export const savePage = async (page: PageContent): Promise<void> => {
    await apiRequest('/pages', 'POST', page);
    const current = await getPages();
    setPersisted(CACHE_KEYS.PAGES, [...current.filter(p => p.id !== page.id), page]);
};
export const getPageBySlug = async (slug: string) => (await getPages()).find(p => p.slug === slug);
export const deletePage = async (id: string) => {
    await apiRequest(`/pages/${id}`, 'DELETE');
    const current = await getPages();
    setPersisted(CACHE_KEYS.PAGES, current.filter(p => p.id !== id));
};

export const getBrands = async (): Promise<Brand[]> => fetchWithPriority(CACHE_KEYS.BRANDS, '/brands', []);
export const saveBrand = async (brand: Brand): Promise<void> => {
    await apiRequest('/brands', 'POST', brand);
    const current = await getBrands();
    setPersisted(CACHE_KEYS.BRANDS, [...current.filter(b => b.id !== brand.id), brand]);
};
export const deleteBrand = async (id: string) => {
    await apiRequest(`/brands/${id}`, 'DELETE');
    const current = await getBrands();
    setPersisted(CACHE_KEYS.BRANDS, current.filter(b => b.id !== id));
};

export const createOrder = async (order: any): Promise<Order> => {
    const res = await apiRequest('/orders', 'POST', order);
    return res || { ...order, id: `ORD-${Date.now()}` };
};
export const getOrders = async (): Promise<Order[]> => apiRequest('/orders') || [];
export const updateOrderStatus = (id: string, status: string) => apiRequest(`/orders/${id}/status`, 'PATCH', { status });
export const deleteOrder = (id: string) => apiRequest(`/orders/${id}`, 'DELETE');
export const cancelOrder = (id: string, reason: string) => apiRequest(`/orders/${id}/cancel`, 'PATCH', { reason });
export const getUserOrders = async (userId: string) => (await getOrders()).filter(o => o.userId === userId);
export const getOrderById = async (id: string) => (await getOrders()).find(o => o.id === id);

export const submitContactMessage = async (msg: any) => apiRequest('/contact', 'POST', msg);
export const getContactMessages = async (): Promise<ContactMessage[]> => apiRequest('/contact') || [];
export const markMessageRead = async (id: string) => apiRequest(`/contact/${id}/read`, 'PATCH');
export const deleteMessage = async (id: string) => apiRequest(`/contact/${id}`, 'DELETE');

export const authenticateUser = async (email: string, password: string): Promise<User | undefined> => {
    if (email === 'gyanforindia7@gmail.com' && password === 'Jaimatadi@16@') {
        return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
    }
    return undefined;
};
export const getUsers = async (): Promise<User[]> => apiRequest('/users') || [];
export const saveUser = async (user: User) => apiRequest('/users', 'POST', user);

export const getCoupons = async (): Promise<Coupon[]> => apiRequest('/coupons') || [];
export const saveCoupon = async (coupon: Coupon) => apiRequest('/coupons', 'POST', coupon);
export const deleteCoupon = async (id: string) => apiRequest(`/coupons/${id}`, 'DELETE');
export const validateCoupon = async (code: string, total: number) => {
    const coupons = await getCoupons();
    return coupons.find(c => c.code === code && c.isActive && (c.minOrderValue || 0) <= total) || null;
};

export const getBlogPosts = async (): Promise<BlogPost[]> => apiRequest('/blog') || [];
export const getBlogPostBySlug = async (slug: string) => (await getBlogPosts()).find(p => p.slug === slug);
export const saveBlogPost = async (post: BlogPost) => apiRequest('/blog', 'POST', post);
export const deleteBlogPost = async (id: string) => apiRequest(`/blog/${id}`, 'DELETE');
export const updateQuoteStatus = (id: string, status: string) => apiRequest(`/quotes/${id}/status`, 'PATCH', { status });
export const submitQuote = (quote: any) => apiRequest('/quotes', 'POST', quote);
export const getQuotes = () => apiRequest('/quotes') || [];
export const deleteQuote = (id: string) => apiRequest(`/quotes/${id}`, 'DELETE');
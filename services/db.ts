import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * HIGH-PERFORMANCE DATABASE SERVICE
 * Uses Stale-While-Revalidate pattern for sub-second loading.
 */

const API_URL = '/api';
const MEM_CACHE: Record<string, any> = {};
let MIGRATION_DONE = false;

const STABLE_KEYS = {
    PRODUCTS: 's2_stable_products',
    CATEGORIES: 's2_stable_categories',
    PAGES: 's2_stable_pages',
    SETTINGS: 's2_stable_settings',
    BRANDS: 's2_stable_brands'
};

const LEGACY_VERSIONS = ['v7', 'v6', 'v5', 'v4', 'v3', 'v2', 'v1', ''];

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
        const response = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, { 
            method, 
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!response.ok) return null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        }
        return { success: true };
    } catch (err) {
        return null;
    }
};

/**
 * Optimized recovery that avoids redundant scans.
 */
const getPersisted = (key: string) => {
    if (MEM_CACHE[key]) return MEM_CACHE[key];
    
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) ? parsed.length > 0 : parsed) {
                MEM_CACHE[key] = parsed;
                return parsed;
            }
        }

        // Only scan legacy if migration hasn't successfully finished this session
        if (!MIGRATION_DONE) {
            const baseKeyName = key.replace('s2_stable_', 's2_cache_');
            for (const ver of LEGACY_VERSIONS) {
                const suffix = ver ? `_${ver}` : '';
                const legacyKey = `${baseKeyName}${suffix}`;
                const legacyData = localStorage.getItem(legacyKey);
                
                if (legacyData) {
                    try {
                        const parsedLegacy = JSON.parse(legacyData);
                        if (Array.isArray(parsedLegacy) ? parsedLegacy.length > 0 : parsedLegacy) {
                            localStorage.setItem(key, legacyData);
                            MEM_CACHE[key] = parsedLegacy;
                            MIGRATION_DONE = true; 
                            return parsedLegacy;
                        }
                    } catch (e) {}
                }
            }
        }
    } catch (e) {}
    return null;
};

const setPersisted = (key: string, data: any) => {
    MEM_CACHE[key] = data;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
};

/**
 * STALE-WHILE-REVALIDATE PATTERN
 * Returns local data immediately, updates from server in background.
 */
const fetchLive = async <T>(key: string, endpoint: string, fallback: T): Promise<T> => {
    const cached = getPersisted(key);
    
    // Trigger background sync
    const syncPromise = apiRequest(endpoint).then(freshData => {
        if (freshData !== null) {
            const hasServerData = Array.isArray(freshData) ? freshData.length > 0 : (freshData && Object.keys(freshData).length > 0);
            if (hasServerData) {
                setPersisted(key, freshData);
                return freshData;
            }
        }
        return null;
    });

    // If we have cache, return it NOW. Don't wait for network.
    if (cached) return cached;

    // No cache? We must wait for first load.
    const result = await syncPromise;
    return (result as unknown as T) || fallback;
};

// --- READ OPERATIONS (Now much faster) ---

export const getProducts = async (): Promise<Product[]> => fetchLive(STABLE_KEYS.PRODUCTS, '/products/all', INITIAL_PRODUCTS);

export const getCategories = async (): Promise<Category[]> => {
    const defaults: Category[] = INITIAL_CATEGORY_NAMES.map((name, i) => ({
        id: `cat-default-${i}`, name, slug: name.toLowerCase().replace(/ /g, '-'), showInMenu: true, showOnHome: true, sortOrder: i
    }));
    return fetchLive(STABLE_KEYS.CATEGORIES, '/categories', defaults);
};

export const getPages = async (): Promise<PageContent[]> => fetchLive(STABLE_KEYS.PAGES, '/pages', []);

export const getSiteSettings = async (): Promise<SiteSettings> => {
    const defaults: SiteSettings = { id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Enterprise Hub, India', whatsappNumber: '' };
    return fetchLive(STABLE_KEYS.SETTINGS, '/settings', defaults);
};

export const getBrands = async (): Promise<Brand[]> => fetchLive(STABLE_KEYS.BRANDS, '/brands', []);

// --- WRITE OPERATIONS ---

export const saveProduct = async (product: Product): Promise<void> => {
    const current = await getProducts();
    const isNew = !product.id || !current.find(p => p.id === product.id);
    const idToUse = isNew ? (product.id || `p-${Date.now()}`) : product.id;
    const cleanProduct = { ...product, id: idToUse };

    const updated = [...current.filter(p => p.id !== idToUse), cleanProduct];
    setPersisted(STABLE_KEYS.PRODUCTS, updated);
    apiRequest(isNew ? '/products' : `/products/${idToUse}`, isNew ? 'POST' : 'PUT', cleanProduct);
};

export const saveCategory = async (cat: Category): Promise<void> => {
    const current = await getCategories();
    const isNew = !cat.id || !current.find(c => c.id === cat.id);
    const idToUse = isNew ? (cat.id || `cat-${Date.now()}`) : cat.id;
    const cleanCat = { ...cat, id: idToUse };

    const updated = [...current.filter(c => c.id !== idToUse), cleanCat];
    setPersisted(STABLE_KEYS.CATEGORIES, updated);
    apiRequest('/categories', 'POST', cleanCat);
};

export const savePage = async (page: PageContent): Promise<void> => {
    const current = await getPages();
    const isNew = !page.id || !current.find(p => p.id === page.id);
    const idToUse = isNew ? (page.id || `pg-${Date.now()}`) : page.id;
    const cleanPage = { ...page, id: idToUse };

    const updated = [...current.filter(p => p.id !== idToUse), cleanPage];
    setPersisted(STABLE_KEYS.PAGES, updated);
    apiRequest('/pages', 'POST', cleanPage);
};

export const saveSiteSettings = async (settings: SiteSettings) => {
    setPersisted(STABLE_KEYS.SETTINGS, settings);
    apiRequest('/settings', 'POST', settings);
};

export const saveBrand = async (brand: Brand) => {
    const current = await getBrands(); 
    const isNew = !brand.id || !current.find(b => b.id === brand.id);
    const idToUse = isNew ? (brand.id || `brand-${Date.now()}`) : brand.id;
    const cleanBrand = { ...brand, id: idToUse };
    
    setPersisted(STABLE_KEYS.BRANDS, [...current.filter(b => b.id !== idToUse), cleanBrand]);
    apiRequest('/brands', 'POST', cleanBrand);
};

// --- DELETE & HELPERS ---

export const deleteProduct = (id: string) => { setPersisted(STABLE_KEYS.PRODUCTS, (getPersisted(STABLE_KEYS.PRODUCTS) || []).filter((p:any) => p.id !== id)); apiRequest(`/products/${id}`, 'DELETE'); };
export const deleteCategory = (id: string) => { setPersisted(STABLE_KEYS.CATEGORIES, (getPersisted(STABLE_KEYS.CATEGORIES) || []).filter((c:any) => c.id !== id)); apiRequest(`/categories/${id}`, 'DELETE'); };
export const deletePage = (id: string) => { setPersisted(STABLE_KEYS.PAGES, (getPersisted(STABLE_KEYS.PAGES) || []).filter((p:any) => p.id !== id)); apiRequest(`/pages/${id}`, 'DELETE'); };
export const deleteBrand = (id: string) => { setPersisted(STABLE_KEYS.BRANDS, (getPersisted(STABLE_KEYS.BRANDS) || []).filter((b:any) => b.id !== id)); apiRequest(`/brands/${id}`, 'DELETE'); };

export const getProductBySlug = async (slug: string) => (await getProducts()).find(p => p.slug === slug);
export const getCategoryBySlug = async (slug: string) => (await getCategories()).find(c => c.slug === slug);
export const getPageBySlug = async (slug: string) => (await getPages()).find(p => p.slug === slug);

// Helper to fetch similar products in the same category
export const getSimilarProducts = async (product: Product): Promise<Product[]> => {
    const all = await getProducts();
    return all.filter(p => p.category === product.category && p.id !== product.id).slice(0, 5);
};

export const clearAllCache = () => {
    Object.keys(MEM_CACHE).forEach(k => delete MEM_CACHE[k]);
    Object.values(STABLE_KEYS).forEach(k => localStorage.removeItem(k));
};

export const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
export const getOrders = async () => apiRequest('/orders') || [];
export const createOrder = async (order: any) => apiRequest('/orders', 'POST', order);
export const getQuotes = async () => apiRequest('/quotes') || [];
export const submitQuote = async (quote: any) => apiRequest('/quotes', 'POST', quote);
export const getContactMessages = async () => apiRequest('/contact') || [];
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
export const deleteOrder = (id: string) => apiRequest(`/orders/${id}`, 'DELETE');
export const deleteQuote = (id: string) => apiRequest(`/quotes/${id}`, 'DELETE');
export const deleteMessage = (id: string) => apiRequest(`/contact/${id}`, 'DELETE');
export const markMessageRead = (id: string) => apiRequest(`/contact/${id}/read`, 'POST');
export const validateCoupon = async (code: string, total: number) => (await apiRequest('/coupons')).find((c: any) => c.code === code && c.isActive && (c.minOrderValue || 0) <= total) || null;
export const getBlogPosts = async () => apiRequest('/blog') || [];
export const getBlogPostBySlug = async (slug: string) => (await getBlogPosts()).find((p: any) => p.slug === slug);
export const saveBlogPost = async (post: BlogPost) => apiRequest('/blog', 'POST', post);
export const deleteBlogPost = async (id: string) => apiRequest(`/blog/${id}`, 'DELETE');
export const getCoupons = async () => apiRequest('/coupons') || [];
export const saveCoupon = async (coupon: Coupon) => apiRequest('/coupons', 'POST', coupon);
export const deleteCoupon = async (id: string) => apiRequest(`/coupons/${id}`, 'DELETE');
export const cancelOrder = (id: string, reason: string) => apiRequest(`/orders/${id}/cancel`, 'POST', { reason });
export const getUserOrders = async (userId: string) => (await getOrders()).filter((o: any) => o.userId === userId);
export const getOrderById = async (id: string) => (await getOrders()).find((o: any) => o.id === id);
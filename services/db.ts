import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * GLOBAL STABLE DATABASE SERVICE
 * Prioritizes Local Storage for instant feedback and data resilience.
 */

const API_URL = '/api';
const MEM_CACHE: Record<string, any> = {};

// STABLE KEYS - Permanent storage locations
const STABLE_KEYS = {
    PRODUCTS: 's2_stable_products',
    CATEGORIES: 's2_stable_categories',
    PAGES: 's2_stable_pages',
    SETTINGS: 's2_stable_settings',
    BRANDS: 's2_stable_brands'
};

// Comprehensive list of legacy keys to scan for "disappeared" data
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
        return null; // Return null on network error to trigger local fallback
    }
};

/**
 * Aggressive recovery of local data from any previous version
 */
const getPersisted = (key: string) => {
    if (MEM_CACHE[key]) return MEM_CACHE[key];
    
    try {
        // 1. Check Stable Key
        let data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) ? parsed.length > 0 : parsed) {
                MEM_CACHE[key] = parsed;
                return parsed;
            }
        }

        // 2. Deep Recovery Bridge
        const baseKeyName = key.includes('stable') 
            ? key.replace('s2_stable_', 's2_cache_') 
            : key;

        for (const ver of LEGACY_VERSIONS) {
            const suffix = ver ? `_${ver}` : '';
            const legacyKey = `${baseKeyName}${suffix}`;
            const legacyData = localStorage.getItem(legacyKey);
            
            if (legacyData) {
                try {
                    const parsedLegacy = JSON.parse(legacyData);
                    if (Array.isArray(parsedLegacy) ? parsedLegacy.length > 0 : parsedLegacy) {
                        console.log(`🚀 Recovered data from: ${legacyKey}`);
                        // Migrate to stable immediately
                        localStorage.setItem(key, legacyData);
                        MEM_CACHE[key] = parsedLegacy;
                        return parsedLegacy;
                    }
                } catch (e) {}
            }
        }
    } catch (e) {}
    return null;
};

const setPersisted = (key: string, data: any) => {
    MEM_CACHE[key] = data;
    try { 
        localStorage.setItem(key, JSON.stringify(data)); 
    } catch (e) {
        console.error("Local Storage Save Error:", e);
    }
};

export const clearAllCache = () => {
    Object.keys(MEM_CACHE).forEach(k => delete MEM_CACHE[k]);
    Object.values(STABLE_KEYS).forEach(k => localStorage.removeItem(k));
    LEGACY_VERSIONS.forEach(v => {
        const suffix = v ? `_${v}` : '';
        localStorage.removeItem(`s2_cache_products${suffix}`);
        localStorage.removeItem(`s2_cache_categories${suffix}`);
        localStorage.removeItem(`s2_cache_pages${suffix}`);
    });
};

/**
 * TRIPLE-CHECK FETCHING
 * Prioritizes actual data presence over just "server online" status.
 */
const fetchLive = async <T>(key: string, endpoint: string, fallback: T): Promise<T> => {
    // 1. Attempt to get fresh data from server
    const freshData = await apiRequest(endpoint);
    
    // Server wins ONLY if it returns non-empty data
    if (freshData !== null) {
        const hasServerData = Array.isArray(freshData) ? freshData.length > 0 : (freshData && Object.keys(freshData).length > 0);
        if (hasServerData) {
            setPersisted(key, freshData);
            return freshData as unknown as T;
        }
    }

    // 2. Check Local Cache (with Deep Recovery)
    const cached = getPersisted(key);
    if (cached) {
        const hasCachedData = Array.isArray(cached) ? cached.length > 0 : true;
        if (hasCachedData) return cached;
    }

    // 3. System Defaults
    return fallback;
};

export const getProducts = async (): Promise<Product[]> => fetchLive(STABLE_KEYS.PRODUCTS, '/products/all', INITIAL_PRODUCTS);

export const getCategories = async (): Promise<Category[]> => {
    const defaultCats: Category[] = INITIAL_CATEGORY_NAMES.map((name, i) => ({
        id: `cat-default-${i}`, name, slug: name.toLowerCase().replace(/ /g, '-'), showInMenu: true, showOnHome: true, sortOrder: i
    }));
    return fetchLive(STABLE_KEYS.CATEGORIES, '/categories', defaultCats);
};

export const getPages = async (): Promise<PageContent[]> => fetchLive(STABLE_KEYS.PAGES, '/pages', []);

export const getSiteSettings = async (): Promise<SiteSettings> => {
    const defaults: SiteSettings = { id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Enterprise Hub, India', whatsappNumber: '' };
    return fetchLive(STABLE_KEYS.SETTINGS, '/settings', defaults);
};

export const getBrands = async (): Promise<Brand[]> => fetchLive(STABLE_KEYS.BRANDS, '/brands', []);

// --- SYNCHRONOUS LOCAL-FIRST PERSISTENCE ---

export const saveProduct = async (product: Product): Promise<void> => {
    const isNew = !product.id || product.id.startsWith('p-new');
    const idToUse = isNew ? `p-${Date.now()}` : product.id;
    const cleanProduct = { ...product, id: idToUse };

    // Update Local Storage IMMEDIATELY (prevents UI lag or loss)
    const current = await getProducts();
    const updated = [...current.filter(p => p.id !== idToUse), cleanProduct];
    setPersisted(STABLE_KEYS.PRODUCTS, updated);

    // Sync to backend in background
    apiRequest(isNew ? '/products' : `/products/${idToUse}`, isNew ? 'POST' : 'PUT', cleanProduct);
};

export const savePage = async (page: PageContent): Promise<void> => {
    const isNew = !page.id || page.id.startsWith('pg-new') || page.id === '';
    const idToUse = isNew ? `pg-${Date.now()}` : page.id;
    const cleanPage = { ...page, id: idToUse };

    const current = await getPages();
    const updated = [...current.filter(p => p.id !== idToUse), cleanPage];
    setPersisted(STABLE_KEYS.PAGES, updated);

    apiRequest('/pages', 'POST', cleanPage);
};

export const saveCategory = async (cat: Category): Promise<void> => {
    const isNew = !cat.id || cat.id.startsWith('cat-new') || cat.id === '';
    const idToUse = isNew ? `cat-${Date.now()}` : cat.id;
    const cleanCat = { ...cat, id: idToUse };

    const current = await getCategories();
    const updated = [...current.filter(c => c.id !== idToUse), cleanCat];
    setPersisted(STABLE_KEYS.CATEGORIES, updated);

    apiRequest('/categories', 'POST', cleanCat);
};

export const saveSiteSettings = async (settings: SiteSettings) => {
    setPersisted(STABLE_KEYS.SETTINGS, settings);
    apiRequest('/settings', 'POST', settings);
};

export const saveBrand = async (brand: Brand) => {
    const isNew = !brand.id || brand.id === '';
    const idToUse = isNew ? `brand-${Date.now()}` : brand.id;
    const current = await getBrands(); 
    setPersisted(STABLE_KEYS.BRANDS, [...current.filter(b => b.id !== idToUse), { ...brand, id: idToUse }]);
    apiRequest('/brands', 'POST', { ...brand, id: idToUse });
};

// --- Standard Helpers ---
export const getProductBySlug = async (slug: string) => (await getProducts()).find(p => p.slug === slug);
export const getCategoryBySlug = async (slug: string) => (await getCategories()).find(c => c.slug === slug);
export const getPageBySlug = async (slug: string) => (await getPages()).find(p => p.slug === slug);
export const deleteProduct = (id: string) => { setPersisted(STABLE_KEYS.PRODUCTS, getPersisted(STABLE_KEYS.PRODUCTS).filter((p:any) => p.id !== id)); apiRequest(`/products/${id}`, 'DELETE'); };
export const deleteCategory = (id: string) => { setPersisted(STABLE_KEYS.CATEGORIES, getPersisted(STABLE_KEYS.CATEGORIES).filter((c:any) => c.id !== id)); apiRequest(`/categories/${id}`, 'DELETE'); };
export const deletePage = (id: string) => { setPersisted(STABLE_KEYS.PAGES, getPersisted(STABLE_KEYS.PAGES).filter((p:any) => p.id !== id)); apiRequest(`/pages/${id}`, 'DELETE'); };
export const deleteBrand = (id: string) => { setPersisted(STABLE_KEYS.BRANDS, getPersisted(STABLE_KEYS.BRANDS).filter((b:any) => b.id !== id)); apiRequest(`/brands/${id}`, 'DELETE'); };

export const getProductsByCategory = async (categoryName: string) => (await getProducts()).filter(p => p.category === categoryName && p.isActive !== false);
export const getSimilarProducts = async (product: Product) => (await getProducts()).filter(p => p.category === product.category && p.id !== product.id && p.isActive !== false).slice(0, 5);
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

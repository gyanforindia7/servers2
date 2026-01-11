
import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * ULTRA-FAST DATABASE SERVICE
 * Optimized for sub-100ms perceived load times via Synchronous Cache Hydration.
 */

const API_URL = '/api';
const MEM_CACHE: Record<string, any> = {};

export const STABLE_KEYS = {
    PRODUCTS: 's2_stable_products',
    CATEGORIES: 's2_stable_categories',
    PAGES: 's2_stable_pages',
    SETTINGS: 's2_stable_settings',
    BRANDS: 's2_stable_brands'
};

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
        const response = await fetch(`${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, { 
            method, 
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
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
 * Synchronous cache retrieval for instant App boot.
 */
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
    if (JSON.stringify(MEM_CACHE[key]) === JSON.stringify(data)) return; // Avoid redundant writes
    MEM_CACHE[key] = data;
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
};

/**
 * STALE-WHILE-REVALIDATE (Non-Blocking)
 * Returns cache instantly, syncs server in background.
 */
const fetchLive = async <T>(key: string, endpoint: string, fallback: T): Promise<T> => {
    const cached = getCacheSync(key, null);
    
    // Perform background sync WITHOUT awaiting it for the return value
    const sync = apiRequest(endpoint).then(freshData => {
        if (freshData !== null) {
            const hasData = Array.isArray(freshData) ? freshData.length > 0 : !!freshData;
            if (hasData) {
                setPersisted(key, freshData);
                return freshData;
            }
        }
        return null;
    });

    if (cached) {
        return cached as unknown as T;
    }

    // Only if no cache exists, we must wait for the first network result
    const result = await sync;
    return (result as unknown as T) || fallback;
};

// --- OPTIMIZED READ OPERATIONS ---

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

// --- FAST WRITE OPERATIONS (Instant Local Feedback) ---

export const saveProduct = async (product: Product): Promise<void> => {
    const current = getCacheSync<Product[]>(STABLE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const isNew = !product.id || !current.find(p => p.id === product.id);
    const idToUse = isNew ? (product.id || `p-${Date.now()}`) : product.id;
    const cleanProduct = { ...product, id: idToUse };

    const updated = [...current.filter(p => p.id !== idToUse), cleanProduct];
    setPersisted(STABLE_KEYS.PRODUCTS, updated);
    apiRequest(isNew ? '/products' : `/products/${idToUse}`, isNew ? 'POST' : 'PUT', cleanProduct);
};

export const saveCategory = async (cat: Category): Promise<void> => {
    const current = getCacheSync<Category[]>(STABLE_KEYS.CATEGORIES, []);
    const isNew = !cat.id || !current.find(c => c.id === cat.id);
    const idToUse = isNew ? (cat.id || `cat-${Date.now()}`) : cat.id;
    const cleanCat = { ...cat, id: idToUse };

    const updated = [...current.filter(c => c.id !== idToUse), cleanCat];
    setPersisted(STABLE_KEYS.CATEGORIES, updated);
    apiRequest('/categories', 'POST', cleanCat);
};

export const savePage = async (page: PageContent): Promise<void> => {
    const current = getCacheSync<PageContent[]>(STABLE_KEYS.PAGES, []);
    const isNew = !page.id || !current.find(p => p.id === page.id);
    const idToUse = isNew ? (page.id || `pg-${Date.now()}`) : page.id;
    const cleanPage = { ...page, id: idToUse };

    const updated = [...current.filter(p => p.id !== idToUse), cleanPage];
    setPersisted(STABLE_KEYS.PAGES, updated);
    apiRequest('/pages', 'POST', cleanPage);
};

export const deleteProduct = (id: string) => { setPersisted(STABLE_KEYS.PRODUCTS, getCacheSync<Product[]>(STABLE_KEYS.PRODUCTS, []).filter(p => p.id !== id)); apiRequest(`/products/${id}`, 'DELETE'); };
export const deleteCategory = (id: string) => { setPersisted(STABLE_KEYS.CATEGORIES, getCacheSync<Category[]>(STABLE_KEYS.CATEGORIES, []).filter(c => c.id !== id)); apiRequest(`/categories/${id}`, 'DELETE'); };
export const deletePage = (id: string) => { setPersisted(STABLE_KEYS.PAGES, getCacheSync<PageContent[]>(STABLE_KEYS.PAGES, []).filter(p => p.id !== id)); apiRequest(`/pages/${id}`, 'DELETE'); };

// --- UTILITIES ---
export const getProductBySlug = async (slug: string) => (await getProducts()).find(p => p.slug === slug);
// Added missing getCategoryBySlug export to resolve import errors in ProductList and Breadcrumbs.
export const getCategoryBySlug = async (slug: string) => (await getCategories()).find(c => c.slug === slug);
export const getSimilarProducts = async (product: Product): Promise<Product[]> => {
    const all = await getProducts();
    return all.filter(p => p.category === product.category && p.id !== product.id).slice(0, 5);
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
export const saveSiteSettings = async (settings: SiteSettings) => { setPersisted(STABLE_KEYS.SETTINGS, settings); apiRequest('/settings', 'POST', settings); };
export const saveBrand = async (brand: Brand) => { const current = getCacheSync<Brand[]>(STABLE_KEYS.BRANDS, []); setPersisted(STABLE_KEYS.BRANDS, [...current.filter(b => b.id !== brand.id), brand]); apiRequest('/brands', 'POST', brand); };
export const deleteBrand = (id: string) => { setPersisted(STABLE_KEYS.BRANDS, getCacheSync<Brand[]>(STABLE_KEYS.BRANDS, []).filter(b => b.id !== id)); apiRequest(`/brands/${id}`, 'DELETE'); };
export const getPageBySlug = async (slug: string) => (await getPages()).find(p => p.slug === slug);
export const clearAllCache = () => { Object.keys(MEM_CACHE).forEach(k => delete MEM_CACHE[k]); Object.values(STABLE_KEYS).forEach(k => localStorage.removeItem(k)); };

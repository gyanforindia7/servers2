import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * PRODUCTION DATABASE SERVICE
 * Optimized for immediate visibility of changes.
 */

const API_URL = '/api';

// Cache management
const MEM_CACHE: Record<string, any> = {};
const CACHE_KEYS = {
    PRODUCTS: 's2_cache_products_v2',
    CATEGORIES: 's2_cache_categories_v2',
    PAGES: 's2_cache_pages_v2',
    QUOTES: 's2_cache_quotes_v2',
    MESSAGES: 's2_cache_messages_v2',
    BRANDS: 's2_cache_brands_v2',
    SETTINGS: 's2_cache_settings_v2'
};

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
        return null;
    }
};

export const clearAllCache = () => {
    // Clear Session Memory
    Object.keys(MEM_CACHE).forEach(key => delete MEM_CACHE[key]);
    // Clear Browser Storage
    localStorage.clear();
    console.log('System cache purged.');
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

// --- Smart Fetch with Force-Update ---
const fetchFresh = async <T>(key: string, endpoint: string, fallback: T): Promise<T> => {
    const cached = getPersisted(key);
    
    // In incognito, we want to skip initial_constants if possible
    // We attempt an immediate fetch
    try {
        const fresh = await apiRequest(endpoint);
        if (fresh && (Array.isArray(fresh) ? fresh.length > 0 : fresh.id)) {
            setPersisted(key, fresh);
            return fresh;
        }
    } catch (e) {}

    return cached || fallback;
};

export const getProducts = async (): Promise<Product[]> => {
    return fetchFresh(CACHE_KEYS.PRODUCTS, '/products/all', INITIAL_PRODUCTS);
};

export const getCategories = async (): Promise<Category[]> => {
    return fetchFresh(CACHE_KEYS.CATEGORIES, '/categories', []);
};

export const getSiteSettings = async (): Promise<SiteSettings> => {
    const defaultSettings: SiteSettings = {
        id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Default Address', whatsappNumber: ''
    };
    return fetchFresh(CACHE_KEYS.SETTINGS, '/settings', defaultSettings);
};

// --- CRUD Operations (Instant Cache Updates) ---
export const saveProduct = async (product: Product): Promise<void> => {
    await apiRequest(product.id && !product.id.startsWith('p-new') ? `/products/${product.id}` : '/products', product.id && !product.id.startsWith('p-new') ? 'PUT' : 'POST', product);
    clearAllCache(); // Force global reload on change
};

// Fix: Added missing deleteProduct (line 4 error in AdminProducts.tsx)
export const deleteProduct = async (id: string): Promise<void> => {
    await apiRequest(`/products/${id}`, 'DELETE');
    clearAllCache();
};

export const saveCategory = async (cat: Category): Promise<void> => {
    await apiRequest('/categories', 'POST', cat);
    clearAllCache();
};

// Fix: Added missing deleteCategory (line 4 error in AdminCategories.tsx)
export const deleteCategory = async (id: string): Promise<void> => {
    await apiRequest(`/categories/${id}`, 'DELETE');
    clearAllCache();
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
    await apiRequest('/settings', 'POST', settings);
    clearAllCache();
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount);
};

// --- Helper accessors ---
export const getProductBySlug = async (slug: string) => (await getProducts()).find(p => p.slug === slug);

// Fix: Added missing getProductsByCategory (line 8 error in Home.tsx)
export const getProductsByCategory = async (categoryName: string): Promise<Product[]> => {
    const products = await getProducts();
    return products.filter(p => p.category === categoryName);
};

// Fix: Added missing getSimilarProducts (line 6 error in ProductDetail.tsx)
export const getSimilarProducts = async (product: Product): Promise<Product[]> => {
    const products = await getProducts();
    return products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 5);
};

export const getCategoryBySlug = async (slug: string) => (await getCategories()).find(c => c.slug === slug);

export const getPages = async () => fetchFresh(CACHE_KEYS.PAGES, '/pages', []);

// Fix: Added missing getPageBySlug (line 4 error in About.tsx, line 6 in DynamicPage.tsx)
export const getPageBySlug = async (slug: string) => (await getPages()).find(p => p.slug === slug);

export const savePage = async (page: PageContent) => { await apiRequest('/pages', 'POST', page); clearAllCache(); };

export const deletePage = async (id: string) => { await apiRequest(`/pages/${id}`, 'DELETE'); clearAllCache(); };

export const getBrands = async () => fetchFresh(CACHE_KEYS.BRANDS, '/brands', []);

export const saveBrand = async (brand: Brand) => { await apiRequest('/brands', 'POST', brand); clearAllCache(); };

// Fix: Added missing deleteBrand (line 4 error in AdminBrands.tsx)
export const deleteBrand = async (id: string): Promise<void> => {
    await apiRequest(`/brands/${id}`, 'DELETE');
    clearAllCache();
};

export const getQuotes = async () => apiRequest('/quotes');

export const submitQuote = async (quote: any) => apiRequest('/quotes', 'POST', quote);

// Fix: Added missing updateQuoteStatus (line 4 error in AdminQuotes.tsx)
export const updateQuoteStatus = async (id: string, status: QuoteRequest['status']): Promise<void> => {
    await apiRequest(`/quotes/${id}`, 'PUT', { status });
    clearAllCache();
};

// Fix: Added missing deleteQuote (line 4 error in AdminQuotes.tsx)
export const deleteQuote = async (id: string): Promise<void> => {
    await apiRequest(`/quotes/${id}`, 'DELETE');
    clearAllCache();
};

export const getOrders = async () => apiRequest('/orders');

// Fix: Added missing getOrderById (line 6 error in ThankYou.tsx)
export const getOrderById = async (id: string): Promise<Order | undefined> => {
    const orders = await getOrders();
    return (orders || []).find((o: Order) => o.id === id);
};

// Fix: Added missing getUserOrders (line 7 error in CustomerDashboard.tsx)
export const getUserOrders = async (userId: string): Promise<Order[]> => {
    const orders = await getOrders();
    return (orders || []).filter((o: Order) => o.userId === userId);
};

export const createOrder = async (order: any) => apiRequest('/orders', 'POST', order);

// Fix: Added missing updateOrderStatus (line 4 error in AdminOrders.tsx)
export const updateOrderStatus = async (id: string, status: Order['status']): Promise<void> => {
    await apiRequest(`/orders/${id}`, 'PUT', { status });
    clearAllCache();
};

// Fix: Added missing cancelOrder (line 4 error in AdminOrders.tsx)
export const cancelOrder = async (id: string, reason?: string): Promise<void> => {
    await apiRequest(`/orders/${id}/cancel`, 'POST', { reason });
    clearAllCache();
};

// Fix: Added missing deleteOrder (line 4 error in AdminOrders.tsx)
export const deleteOrder = async (id: string): Promise<void> => {
    await apiRequest(`/orders/${id}`, 'DELETE');
    clearAllCache();
};

// Fix: Added missing getUsers (line 4 error in AuthModal.tsx)
export const getUsers = async (): Promise<User[]> => {
    const result = await apiRequest('/users');
    return Array.isArray(result) ? result : [];
};

// Fix: Added missing saveUser (line 4 error in AuthModal.tsx)
export const saveUser = async (user: User): Promise<void> => {
    await apiRequest('/users', 'POST', user);
    clearAllCache();
};

export const authenticateUser = async (email: string, password: string): Promise<User | undefined> => {
    if (email === 'gyanforindia7@gmail.com' && password === 'Jaimatadi@16@') {
        return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
    }
    const users = await getUsers();
    return users.find(u => u.email === email && u.password === password);
};

export const getContactMessages = async () => apiRequest('/contact');

export const submitContactMessage = async (msg: any) => apiRequest('/contact', 'POST', msg);

// Fix: Added missing markMessageRead (line 4 error in AdminMessages.tsx)
export const markMessageRead = async (id: string): Promise<void> => {
    await apiRequest(`/contact/${id}/read`, 'POST');
    clearAllCache();
};

// Fix: Added missing deleteMessage (line 4 error in AdminMessages.tsx)
export const deleteMessage = async (id: string): Promise<void> => {
    await apiRequest(`/contact/${id}`, 'DELETE');
    clearAllCache();
};

export const getCoupons = async () => apiRequest('/coupons');

export const saveCoupon = async (coupon: Coupon) => apiRequest('/coupons', 'POST', coupon);

// Fix: Added missing deleteCoupon (line 4 error in AdminCoupons.tsx)
export const deleteCoupon = async (id: string): Promise<void> => {
    await apiRequest(`/coupons/${id}`, 'DELETE');
    clearAllCache();
};

// Fix: Added missing validateCoupon (line 8 error in Checkout.tsx)
export const validateCoupon = async (code: string, subtotal: number): Promise<Coupon | undefined> => {
    const coupons = await getCoupons();
    if (!coupons) return undefined;
    const coupon = coupons.find((c: Coupon) => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (coupon && (!coupon.minOrderValue || subtotal >= coupon.minOrderValue)) {
        return coupon;
    }
    return undefined;
};

export const getBlogPosts = async () => apiRequest('/blog');

export const getBlogPostBySlug = async (slug: string) => (await getBlogPosts()).find(p => p.slug === slug);

export const saveBlogPost = async (post: BlogPost) => apiRequest('/blog', 'POST', post);

// Fix: Added missing deleteBlogPost (line 3 error in AdminBlog.tsx)
export const deleteBlogPost = async (id: string): Promise<void> => {
    await apiRequest(`/blog/${id}`, 'DELETE');
    clearAllCache();
};

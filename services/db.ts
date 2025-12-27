
import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * PRODUCTION DATABASE SERVICE
 * Optimized with timeouts and LocalStorage fallbacks for maximum resilience.
 */

const API_URL = '/api';

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    
    // Increased to 10s for Cloud Run cold starts
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
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
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`API Request failed for ${path}.`, err);
        throw err;
    }
};

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
        const products = await apiRequest('/products');
        return (products && Array.isArray(products) && products.length > 0) ? products : INITIAL_PRODUCTS;
    } catch {
        return INITIAL_PRODUCTS;
    }
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
    try {
        const products = await getProducts();
        return products.find(p => p.id === id);
    } catch {
        return INITIAL_PRODUCTS.find(p => p.id === id);
    }
};

export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
    try {
        const products = await getProducts();
        return products.find(p => p.slug === slug);
    } catch {
        return INITIAL_PRODUCTS.find(p => p.slug === slug);
    }
};

export const getProductsByCategory = async (categoryName: string): Promise<Product[]> => {
    try {
        const products = await getProducts();
        return products.filter(p => p.category === categoryName && p.isActive !== false);
    } catch {
        return INITIAL_PRODUCTS.filter(p => p.category === categoryName && p.isActive !== false);
    }
};

export const getSimilarProducts = async (currentProduct: Product): Promise<Product[]> => {
    try {
        const products = await getProducts();
        return products.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id).slice(0, 5);
    } catch {
        return INITIAL_PRODUCTS.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id).slice(0, 5);
    }
};

export const saveProduct = async (product: Product): Promise<void> => {
    try {
        if (product.id && !product.id.startsWith('p-new')) {
            await apiRequest(`/products/${product.id}`, 'PUT', product);
        } else {
            await apiRequest('/products', 'POST', { ...product, id: `p-${Date.now()}` });
        }
    } catch (err) {
        console.error("Save Product Error:", err);
    }
};

export const deleteProduct = async (id: string): Promise<void> => apiRequest(`/products/${id}`, 'DELETE');

// --- Categories ---
export const getCategories = async (): Promise<Category[]> => {
    try {
        const categories = await apiRequest('/categories');
        if (categories && Array.isArray(categories) && categories.length > 0) return categories;
        
        return INITIAL_CATEGORY_NAMES.map((name, i) => ({
            id: `cat-${i}`,
            name,
            slug: name.toLowerCase().replace(/ /g, '-'),
            showOnHome: true,
            showInMenu: true
        }));
    } catch {
        return INITIAL_CATEGORY_NAMES.map((name, i) => ({
            id: `cat-${i}`,
            name,
            slug: name.toLowerCase().replace(/ /g, '-'),
            showOnHome: true,
            showInMenu: true
        }));
    }
};

export const saveCategory = async (cat: Category): Promise<void> => apiRequest('/categories', 'POST', cat);
export const deleteCategory = async (id: string): Promise<void> => apiRequest(`/categories/${id}`, 'DELETE');

export const getCategoryBySlug = async (slug: string): Promise<Category | undefined> => {
    try {
        const categories = await getCategories();
        return categories.find(c => c.slug === slug);
    } catch {
        return undefined;
    }
};

export const getCategoryHierarchy = async (): Promise<Category[]> => {
    try {
        const allCats = await getCategories();
        return allCats.filter(c => !c.parentId); 
    } catch {
        return [];
    }
};

// --- Settings ---
export const getSiteSettings = async (): Promise<SiteSettings> => {
    try {
        return await apiRequest('/settings');
    } catch {
        return {
            id: 'settings',
            supportPhone: '+91 000 000 0000',
            supportEmail: 'support@serverpro.com',
            address: 'Default Address',
            whatsappNumber: ''
        };
    }
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => apiRequest('/settings', 'POST', settings);

// --- Orders ---
export const createOrder = async (order: any): Promise<Order> => apiRequest('/orders', 'POST', order);
export const getOrders = async (): Promise<Order[]> => {
    try {
        const orders = await apiRequest('/orders');
        return Array.isArray(orders) ? orders : [];
    } catch {
        return [];
    }
};

export const updateOrderStatus = async (id: string, status: string): Promise<void> => apiRequest(`/orders/${id}/status`, 'PATCH', { status });
export const deleteOrder = async (id: string): Promise<void> => apiRequest(`/orders/${id}`, 'DELETE');
export const cancelOrder = async (id: string, reason: string): Promise<void> => apiRequest(`/orders/${id}/cancel`, 'PATCH', { reason });

export const getUserOrders = async (userId: string): Promise<Order[]> => {
    try {
        const orders = await getOrders();
        return orders.filter(o => o.userId === userId);
    } catch {
        return [];
    }
};

export const getOrderById = async (id: string): Promise<Order | undefined> => {
    try {
        const orders = await getOrders();
        return orders.find(o => o.id === id);
    } catch {
        return undefined;
    }
};

// --- Auth ---
export const authenticateUser = async (email: string, password: string): Promise<User | undefined> => {
    try {
        if (email === 'gyanforindia7@gmail.com' && password === 'Jaimatadi@16@') {
            return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
        }
        return undefined;
    } catch {
        return undefined;
    }
};
export const getUsers = async (): Promise<User[]> => {
    try {
        const users = await apiRequest('/users');
        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
};
export const saveUser = async (user: User): Promise<void> => apiRequest('/users', 'POST', user);

// --- Misc & Persistence Fallbacks ---
const LOCAL_STORAGE_QUOTES = 's2_offline_quotes';
const LOCAL_STORAGE_MESSAGES = 's2_offline_messages';

export const submitQuote = async (quote: any): Promise<void> => {
    try {
        await apiRequest('/quotes', 'POST', quote);
    } catch (err) {
        console.warn("Backend unavailable, saving quote to local cache.");
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUOTES) || '[]');
        localStorage.setItem(LOCAL_STORAGE_QUOTES, JSON.stringify([...existing, { ...quote, id: `offline-${Date.now()}`, date: new Date().toISOString(), status: 'Pending' }]));
    }
};

export const getQuotes = async (): Promise<QuoteRequest[]> => {
    try {
        const quotes = await apiRequest('/quotes');
        const offline = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUOTES) || '[]');
        return [...offline, ...(Array.isArray(quotes) ? quotes : [])];
    } catch {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUOTES) || '[]');
    }
};

export const updateQuoteStatus = async (id: string, status: string): Promise<void> => {
    if (id.startsWith('offline-')) {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUOTES) || '[]');
        const updated = existing.map((q: any) => q.id === id ? { ...q, status } : q);
        localStorage.setItem(LOCAL_STORAGE_QUOTES, JSON.stringify(updated));
        return;
    }
    return apiRequest(`/quotes/${id}/status`, 'PATCH', { status });
};

export const deleteQuote = async (id: string): Promise<void> => {
     if (id.startsWith('offline-')) {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_QUOTES) || '[]');
        localStorage.setItem(LOCAL_STORAGE_QUOTES, JSON.stringify(existing.filter((q: any) => q.id !== id)));
        return;
    }
    return apiRequest(`/quotes/${id}`, 'DELETE');
};

export const submitContactMessage = async (msg: any): Promise<void> => {
    try {
        await apiRequest('/contact', 'POST', msg);
    } catch (err) {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MESSAGES) || '[]');
        localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify([...existing, { ...msg, id: `offline-${Date.now()}`, date: new Date().toISOString(), status: 'New' }]));
    }
};

export const getContactMessages = async (): Promise<ContactMessage[]> => {
    try {
        const msgs = await apiRequest('/contact');
        const offline = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MESSAGES) || '[]');
        return [...offline, ...(Array.isArray(msgs) ? msgs : [])];
    } catch {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_MESSAGES) || '[]');
    }
};

export const markMessageRead = async (id: string): Promise<void> => {
    if (id.startsWith('offline-')) {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MESSAGES) || '[]');
        const updated = existing.map((m: any) => m.id === id ? { ...m, status: 'Read' } : m);
        localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(updated));
        return;
    }
    return apiRequest(`/contact/${id}/read`, 'PATCH');
};

export const deleteMessage = async (id: string): Promise<void> => {
    if (id.startsWith('offline-')) {
        const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_MESSAGES) || '[]');
        localStorage.setItem(LOCAL_STORAGE_MESSAGES, JSON.stringify(existing.filter((m: any) => m.id !== id)));
        return;
    }
    return apiRequest(`/contact/${id}`, 'DELETE');
};

export const getBrands = async (): Promise<Brand[]> => {
    try {
        const brands = await apiRequest('/brands');
        return Array.isArray(brands) ? brands : [];
    } catch {
        return [];
    }
};
export const saveBrand = async (brand: Brand): Promise<void> => apiRequest('/brands', 'POST', brand);
export const deleteBrand = async (id: string): Promise<void> => apiRequest(`/brands/${id}`, 'DELETE');

export const getPages = async (): Promise<PageContent[]> => {
    try {
        const pages = await apiRequest('/pages');
        return Array.isArray(pages) ? pages : [];
    } catch {
        return [];
    }
};
export const getPageBySlug = async (slug: string): Promise<PageContent | undefined> => {
    try {
        const pages = await getPages();
        return pages.find(p => p.slug === slug);
    } catch {
        return undefined;
    }
};
export const savePage = async (page: PageContent): Promise<void> => apiRequest('/pages', 'POST', page);
export const deletePage = async (id: string): Promise<void> => apiRequest(`/pages/${id}`, 'DELETE');

export const getBlogPosts = async (): Promise<BlogPost[]> => {
    try {
        const posts = await apiRequest('/blog');
        return Array.isArray(posts) ? posts : [];
    } catch {
        return [];
    }
};
export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | undefined> => {
    try {
        const posts = await getBlogPosts();
        return posts.find(p => p.slug === slug);
    } catch {
        return undefined;
    }
};
export const saveBlogPost = async (post: BlogPost): Promise<void> => apiRequest('/blog', 'POST', post);
export const deleteBlogPost = async (id: string): Promise<void> => apiRequest(`/blog/${id}`, 'DELETE');

export const getCoupons = async (): Promise<Coupon[]> => {
    try {
        const coupons = await apiRequest('/coupons');
        return Array.isArray(coupons) ? coupons : [];
    } catch {
        return [];
    }
};
export const saveCoupon = async (coupon: Coupon): Promise<void> => apiRequest('/coupons', 'POST', coupon);
export const deleteCoupon = async (id: string): Promise<void> => apiRequest(`/coupons/${id}`, 'DELETE');
export const validateCoupon = async (code: string, total: number): Promise<Coupon | null> => {
    try {
        const coupons = await getCoupons();
        return coupons.find(c => c.code === code && c.isActive && (c.minOrderValue || 0) <= total) || null;
    } catch {
        return null;
    }
};

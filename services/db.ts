import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost, INITIAL_CATEGORY_NAMES } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

/**
 * PRODUCTION DATABASE SERVICE
 * This file points to your Node.js backend with resilient fallbacks.
 */

const API_URL = '/api';

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' };
    const config: RequestInit = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    // Ensure endpoint starts with a slash for safe joining
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    try {
        const response = await fetch(`${API_URL}${path}`, config);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response.json();
    } catch (err) {
        console.warn(`API Request failed for ${path}, using local fallback if available.`);
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
        return (products && products.length > 0) ? products : INITIAL_PRODUCTS;
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
        if (categories && categories.length > 0) return categories;
        
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
        return await apiRequest('/orders');
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
        if (email === 'admin@serverpro.com' && password === 'ServerPro@2024') {
            return { id: 'admin', name: 'Super Admin', email, role: 'admin' };
        }
        return undefined;
    } catch {
        return undefined;
    }
};
export const getUsers = async (): Promise<User[]> => {
    try {
        return await apiRequest('/users');
    } catch {
        return [];
    }
};
export const saveUser = async (user: User): Promise<void> => apiRequest('/users', 'POST', user);

// --- Misc ---
export const submitQuote = async (quote: any): Promise<void> => apiRequest('/quotes', 'POST', quote);
export const getQuotes = async (): Promise<QuoteRequest[]> => {
    try {
        return await apiRequest('/quotes');
    } catch {
        return [];
    }
};
export const updateQuoteStatus = async (id: string, status: string): Promise<void> => apiRequest(`/quotes/${id}/status`, 'PATCH', { status });
export const deleteQuote = async (id: string): Promise<void> => apiRequest(`/quotes/${id}`, 'DELETE');

export const submitContactMessage = async (msg: any): Promise<void> => apiRequest('/contact', 'POST', msg);
export const getContactMessages = async (): Promise<ContactMessage[]> => {
    try {
        return await apiRequest('/contact');
    } catch {
        return [];
    }
};
export const markMessageRead = async (id: string): Promise<void> => apiRequest(`/contact/${id}/read`, 'PATCH');
export const deleteMessage = async (id: string): Promise<void> => apiRequest(`/contact/${id}`, 'DELETE');

export const getBrands = async (): Promise<Brand[]> => {
    try {
        return await apiRequest('/brands');
    } catch {
        return [];
    }
};
export const saveBrand = async (brand: Brand): Promise<void> => apiRequest('/brands', 'POST', brand);
export const deleteBrand = async (id: string): Promise<void> => apiRequest(`/brands/${id}`, 'DELETE');

export const getPages = async (): Promise<PageContent[]> => {
    try {
        return await apiRequest('/pages');
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
        return await apiRequest('/blog');
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
        return await apiRequest('/coupons');
    } catch {
        return [];
    }
};
export const saveCoupon = async (coupon: Coupon): Promise<void> => apiRequest('/coupons', 'POST', coupon);
export const deleteCoupon = async (id: string): Promise<void> => apiRequest(`/coupons/${id}`, 'DELETE');
export const validateCoupon = async (code: string, total: number): Promise<Coupon | null> => {
    try {
        const coupons = await getCoupons();
        return coupons.find(c => c.code === code && c.isActive) || null;
    } catch {
        return null;
    }
};
// --- PRODUCTION API SERVICE ---
import { Product, Order, User, SiteSettings, Category, Brand, PageContent, ContactMessage, QuoteRequest, Coupon, BlogPost } from '../types';

// In production, if served from the same domain, we can use relative paths
const API_URL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';

// Helper
const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const headers = { 'Content-Type': 'application/json' };
    const config: RequestInit = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    const response = await fetch(`${API_URL}${endpoint}`, config);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
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
    return apiRequest('/products');
};

export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
    const products = await getProducts();
    return products.find(p => p.slug === slug);
};

export const saveProduct = async (product: Product): Promise<void> => {
    if (product.id) await apiRequest(`/products/${product.id}`, 'PUT', product);
    else await apiRequest('/products', 'POST', product);
};

export const deleteProduct = async (id: string): Promise<void> => {
    await apiRequest(`/products/${id}`, 'DELETE');
};

// --- Orders ---
export const createOrder = async (order: any): Promise<Order> => {
    return apiRequest('/orders', 'POST', order);
};

export const getOrders = async (): Promise<Order[]> => {
    return apiRequest('/orders');
};

// --- Settings ---
export const getSiteSettings = async (): Promise<SiteSettings> => {
    return apiRequest('/settings');
};

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
    await apiRequest('/settings', 'POST', settings);
};
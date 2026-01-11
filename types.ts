
export type CategoryType = string;

export interface SEOData {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl?: string;
  robots?: string;
  ogImage?: string;
}

export interface GoogleMerchantData {
  gtin?: string;
  mpn?: string;
  googleProductCategory?: string;
  identifierExists?: boolean;
  customLabel0?: string;
  customLabel1?: string;
  customLabel2?: string;
  customLabel3?: string;
  customLabel4?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  showOnHome?: boolean;
  showInMenu?: boolean; 
  showInFooter?: boolean;
  parentId?: string;
  children?: Category[];
  sortOrder?: number;
  seo?: SEOData;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  seo?: SEOData;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string;
  description: string;
  price: number;
  taxRate?: number;
  specs: Record<string, string>;
  additionalSpecs?: Record<string, string>;
  stock: number;
  imageUrl: string;
  condition: 'New' | 'Refurbished';
  isActive: boolean;
  isFeatured?: boolean;
  allowDirectBuy?: boolean;
  seo?: SEOData;
  gmc?: GoogleMerchantData;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  password?: string;
  company?: string;
  phone?: string;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: CartItem[];
  total: number;
  discount?: number;
  couponCode?: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  cancellationReason?: string;
  shippingDetails: ShippingDetails;
  paymentMethod: string;
}

export interface QuoteRequest {
  id: string;
  products: { productId: string; productName: string; quantity: number }[];
  customerName: string;
  customerEmail: string;
  message?: string;
  status: 'Pending' | 'Processed';
  date: string;
}

export interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  date: string;
  status: 'New' | 'Read';
}

export interface PageContent {
  id: string;
  slug: string; 
  title: string;
  content: string; 
  showInMenu?: boolean; 
  showInFooter?: boolean;
  sortOrder?: number;
  seo?: SEOData;
}

export interface SiteSettings {
  id: 'settings';
  logoUrl?: string;
  faviconUrl?: string;
  bannerUrl?: string;
  whatsappNumber: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  homeSeo?: SEOData;
  googleAnalyticsId?: string;
  taxRates?: number[];
  enableCOD?: boolean;
  enableRazorpay?: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  enablePhonePe?: boolean;
  phonePeMerchantId?: string;
  phonePeSaltKey?: string;
  phonePeSaltIndex?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  isActive: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; 
  coverImage: string;
  author: string;
  date: string;
  tags: string[];
  seo?: SEOData;
}

export const INITIAL_CATEGORY_NAMES: string[] = [
  'Servers',
  'Storage',
  'Workstations',
  'Laptops',
  'Option & Spares'
];

export const INITIAL_BRAND_NAMES = ['Dell', 'HP', 'Lenovo', 'IBM', 'Cisco', 'Apple', 'Supermicro'];

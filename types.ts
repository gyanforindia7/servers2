
export type CategoryType = string;

export interface SEOData {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl?: string; // New: Custom canonical
  robots?: string; // New: index,follow etc.
  ogImage?: string; // New: Social share image override
}

export interface GoogleMerchantData {
  gtin?: string;
  mpn?: string;
  googleProductCategory?: string;
  identifierExists?: boolean; // New: For items without GTIN
  customLabel0?: string; // New: For ad campaigns
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
  showInFooter?: boolean; // New: Footer visibility
  parentId?: string;
  children?: Category[];
  sortOrder?: number; // New: For menu ordering
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
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'; // Added Cancelled
  cancellationReason?: string; // Added reason
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
  showInFooter?: boolean; // New: Footer visibility
  sortOrder?: number; // New: For menu ordering
  seo?: SEOData;
}

export interface SiteSettings {
  id: 'settings';
  logoUrl?: string;
  bannerUrl?: string;
  whatsappNumber: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  homeSeo?: SEOData;
  googleAnalyticsId?: string; // New: GA ID
  taxRates?: number[]; // New: Configurable Tax Rates
  
  // Payment Settings
  enableCOD?: boolean;
  
  // Razorpay
  enableRazorpay?: boolean;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;

  // PhonePe
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

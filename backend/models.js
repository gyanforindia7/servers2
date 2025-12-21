
const mongoose = require('mongoose');

// --- Product Schema ---
const ProductSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // Legacy ID support
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  sku: { type: String, required: true },
  category: { type: String, required: true },
  brand: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  taxRate: { type: Number, default: 0.18 },
  specs: { type: Map, of: String },
  additionalSpecs: { type: Map, of: String },
  stock: { type: Number, default: 0 },
  imageUrl: String,
  condition: { type: String, enum: ['New', 'Refurbished'], default: 'Refurbished' },
  isActive: { type: Boolean, default: true },
  allowDirectBuy: { type: Boolean, default: false },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: String,
    canonicalUrl: String,
    robots: String,
    ogImage: String
  },
  gmc: {
    gtin: String,
    mpn: String,
    googleProductCategory: String,
    identifierExists: Boolean,
    customLabel0: String,
    customLabel1: String
  }
}, { timestamps: true });

// --- Order Schema ---
const OrderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  userId: String,
  date: Date,
  items: Array,
  total: Number,
  discount: Number,
  couponCode: String,
  status: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
  cancellationReason: String,
  shippingDetails: {
    fullName: String,
    email: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  paymentMethod: String
}, { timestamps: true });

// --- User Schema ---
const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  phone: String,
  company: String
}, { timestamps: true });

// --- Settings Schema ---
const SettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'settings' },
  logoUrl: String,
  bannerUrl: String,
  whatsappNumber: String,
  supportPhone: String,
  supportEmail: String,
  address: String,
  facebookUrl: String,
  linkedinUrl: String,
  twitterUrl: String,
  googleAnalyticsId: String,
  taxRates: [Number],
  enableCOD: Boolean,
  enableRazorpay: Boolean,
  razorpayKeyId: String,
  razorpayKeySecret: String,
  enablePhonePe: Boolean,
  phonePeMerchantId: String,
  phonePeSaltKey: String,
  phonePeSaltIndex: String,
  homeSeo: Object
});

// --- Category Schema ---
const CategorySchema = new mongoose.Schema({
  id: String,
  name: String,
  slug: String,
  description: String,
  imageUrl: String,
  showOnHome: Boolean,
  showInMenu: Boolean,
  showInFooter: Boolean,
  parentId: String,
  sortOrder: Number,
  seo: Object
});

// --- Brand Schema ---
const BrandSchema = new mongoose.Schema({
  id: String,
  name: String,
  slug: String,
  description: String,
  imageUrl: String,
  seo: Object
});

// --- Page Schema ---
const PageSchema = new mongoose.Schema({
  id: String,
  slug: String,
  title: String,
  content: String,
  showInMenu: Boolean,
  showInFooter: Boolean,
  sortOrder: Number,
  seo: Object
});

// --- Quote Schema ---
const QuoteSchema = new mongoose.Schema({
  id: String,
  products: Array,
  customerName: String,
  customerEmail: String,
  message: String,
  status: { type: String, enum: ['Pending', 'Processed'], default: 'Pending' },
  date: Date
}, { timestamps: true });

// --- Contact Schema ---
const ContactSchema = new mongoose.Schema({
  id: String,
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  subject: String,
  message: String,
  status: { type: String, enum: ['New', 'Read'], default: 'New' },
  date: Date
}, { timestamps: true });

// --- Coupon Schema ---
const CouponSchema = new mongoose.Schema({
  id: String,
  code: { type: String, unique: true },
  type: { type: String, enum: ['percentage', 'fixed'] },
  value: Number,
  minOrderValue: Number,
  isActive: Boolean
});

// --- Blog Schema ---
const BlogSchema = new mongoose.Schema({
  id: String,
  title: String,
  slug: { type: String, unique: true },
  excerpt: String,
  content: String,
  coverImage: String,
  author: String,
  date: Date,
  tags: [String],
  seo: Object
}, { timestamps: true });

module.exports = {
  Product: mongoose.model('Product', ProductSchema),
  Order: mongoose.model('Order', OrderSchema),
  User: mongoose.model('User', UserSchema),
  Settings: mongoose.model('Settings', SettingsSchema),
  Category: mongoose.model('Category', CategorySchema),
  Brand: mongoose.model('Brand', BrandSchema),
  Page: mongoose.model('Page', PageSchema),
  Quote: mongoose.model('Quote', QuoteSchema),
  Contact: mongoose.model('Contact', ContactSchema),
  Coupon: mongoose.model('Coupon', CouponSchema),
  BlogPost: mongoose.model('BlogPost', BlogSchema)
};

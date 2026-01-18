const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { 
  Product, Order, User, Settings, Category, Brand, Page, 
  Quote, Contact, Coupon, BlogPost 
} = require('./models');
const mongoose = require('mongoose');

// Initialize AI if key is present
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

/**
 * RECURSIVE DEEP SANITIZE
 * Strips _id and __v from any depth to prevent Mongoose "Immutable Field" errors.
 */
const deepSanitize = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(deepSanitize);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (key !== '_id' && key !== '__v') {
                newObj[key] = deepSanitize(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

/**
 * UNIFIED UPSERT HANDLER
 * Standardizes saving logic across all entity types.
 */
const handleUpsert = async (Model, req, res, queryField = 'id') => {
    try {
        const data = deepSanitize(req.body);
        const queryId = data[queryField] || req.params.id;
        
        if (!queryId || queryId === "") {
            const prefix = Model.modelName.toLowerCase().substring(0,1);
            data[queryField] = `${prefix}-${Date.now()}`;
        } else {
            data[queryField] = queryId;
        }

        const result = await Model.findOneAndUpdate(
            { [queryField]: data[queryField] },
            data,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json(result);
    } catch (err) {
        console.error(`Save Error [${Model.modelName}]:`, err);
        res.status(500).json({ error: err.message });
    }
};

// --- AI Proxy Routes ---
router.post('/ai/description', async (req, res) => {
    try {
        if (!ai) return res.status(500).json({ error: "AI not configured" });
        const { productName, brand, category } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a professional e-commerce description for a ${brand} ${productName} in ${category}. 150-250 words with HTML tags.`,
        });
        res.json({ text: response.text });
    } catch (err) { res.status(500).json({ error: "AI Error" }); }
});

router.post('/ai/seo', async (req, res) => {
    try {
        if (!ai) return res.status(500).json({ error: "AI not configured" });
        const { productName, description } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate SEO JSON: metaTitle, metaDescription, keywords for "${productName}".`,
            config: { responseMimeType: "application/json" }
        });
        res.json(JSON.parse(response.text));
    } catch (err) { res.status(500).json({ error: "AI Error" }); }
});

// --- Entities Routes ---

// Products
router.get('/products/all', async (req, res) => {
    try {
      const products = await Product.find({}).sort({ updatedAt: -1 }).lean();
      res.json(products || []);
    } catch (err) { res.status(500).json([]); }
});
router.post('/products', (req, res) => handleUpsert(Product, req, res));
router.put('/products/:id', (req, res) => handleUpsert(Product, req, res));
router.delete('/products/:id', async (req, res) => {
    try {
        await Product.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Categories
router.get('/categories', async (req, res) => {
    try {
        const cats = await Category.find({}).sort({ sortOrder: 1 }).lean();
        res.json(cats || []);
    } catch (err) { res.status(500).json([]); }
});
router.post('/categories', (req, res) => handleUpsert(Category, req, res));
router.delete('/categories/:id', async (req, res) => {
    try {
        await Category.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Brands
router.get('/brands', async (req, res) => {
    try {
        const brands = await Brand.find({}).lean();
        res.json(brands || []);
    } catch (err) { res.json([]); }
});
router.post('/brands', (req, res) => handleUpsert(Brand, req, res));
router.delete('/brands/:id', async (req, res) => {
    try {
        await Brand.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({}); }
});

// Site Settings
router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne({ id: 'settings' });
        if (!settings) {
            settings = await new Settings({ id: 'settings', supportPhone: '...', supportEmail: '...', address: '...' }).save();
        }
        res.json(settings);
    } catch (err) { res.status(500).json({}); }
});
router.post('/settings', (req, res) => handleUpsert(Settings, req, res));

// CMS Pages
router.get('/pages', async (req, res) => {
    try {
        const pages = await Page.find({}).sort({ sortOrder: 1 }).lean();
        res.json(pages || []);
    } catch (err) { res.json([]); }
});
router.post('/pages', (req, res) => handleUpsert(Page, req, res));
router.delete('/pages/:id', async (req, res) => {
    try {
        await Page.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({}); }
});

// Blog Posts
router.get('/blog', async (req, res) => {
    try {
        const posts = await BlogPost.find({}).sort({ date: -1 }).lean();
        res.json(posts || []);
    } catch (err) { res.json([]); }
});
router.post('/blog', (req, res) => handleUpsert(BlogPost, req, res));
router.delete('/blog/:id', async (req, res) => {
    try {
        await BlogPost.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({}); }
});

// Coupons
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find({}).lean();
        res.json(coupons || []);
    } catch (err) { res.json([]); }
});
router.post('/coupons', (req, res) => handleUpsert(Coupon, req, res));
router.delete('/coupons/:id', async (req, res) => {
    try {
        await Coupon.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({}); }
});

// Orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
        res.json(orders || []);
    } catch (err) { res.json([]); }
});
router.post('/orders', async (req, res) => {
    try {
        const data = req.body;
        const newOrder = await new Order({ ...data, id: `ORD-${Date.now()}` }).save();
        res.json(newOrder);
    } catch (err) { res.status(500).json({}); }
});
router.put('/orders/:id', (req, res) => handleUpsert(Order, req, res));
router.delete('/orders/:id', async (req, res) => {
    try {
        await Order.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({}); }
});

// Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).lean();
        res.json(users || []);
    } catch (err) { res.json([]); }
});
router.post('/users', (req, res) => handleUpsert(User, req, res, 'email'));

// Quotes & Contact
router.get('/quotes', async (req, res) => {
    try {
        const quotes = await Quote.find({}).sort({ createdAt: -1 }).lean();
        res.json(quotes || []);
    } catch (err) { res.json([]); }
});
router.post('/quotes', async (req, res) => {
    try {
        const quote = await new Quote({ ...req.body, id: `QT-${Date.now()}`, date: new Date() }).save();
        res.json(quote);
    } catch (err) { res.status(500).json({}); }
});
router.delete('/quotes/:id', async (req, res) => {
    try {
        await Quote.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({}); }
});

router.get('/contact', async (req, res) => {
    try {
        const msgs = await Contact.find({}).sort({ createdAt: -1 }).lean();
        res.json(msgs || []);
    } catch (err) { res.json([]); }
});
router.post('/contact', async (req, res) => {
    try {
        const msg = await new Contact({ ...req.body, id: `MSG-${Date.now()}`, date: new Date() }).save();
        res.json(msg);
    } catch (err) { res.status(500).json({}); }
});
router.delete('/contact/:id', async (req, res) => {
    try {
        await Contact.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({}); }
});

module.exports = router;

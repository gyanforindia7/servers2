
const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { 
  Product, Order, User, Settings, Category, Brand, Page, 
  Quote, Contact, Coupon, BlogPost 
} = require('./models');
const mongoose = require('mongoose');

// Initialize AI
let ai;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

/**
 * RECURSIVE DEEP SANITIZE
 * Prevents Mongoose "Immutable Field" errors by purging internal keys from nested objects.
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
 * Correctly identifies whether to update or create based on ID.
 */
const handleUpsert = async (Model, req, res, queryField = 'id') => {
    try {
        const data = deepSanitize(req.body);
        
        // Priority: ID in URL > ID in Body > Generate New
        const idToQuery = req.params.id || data[queryField];
        
        if (!idToQuery || idToQuery === "") {
            const prefix = Model.modelName.toLowerCase().substring(0,1);
            data[queryField] = `${prefix}-${Date.now()}`;
        } else {
            data[queryField] = idToQuery;
        }

        // Perform the save
        const result = await Model.findOneAndUpdate(
            { [queryField]: data[queryField] },
            data,
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
        );
        
        res.json(result);
    } catch (err) {
        console.error(`Save Error [${Model.modelName}]:`, err);
        // Better error reporting for the frontend
        res.status(500).json({ 
            error: err.code === 11000 ? 'Duplicate key error: A record with this slug or SKU already exists.' : err.message 
        });
    }
};

// --- AI Routes ---
router.post('/ai/description', async (req, res) => {
    try {
        if (!ai) return res.status(500).json({ error: "AI not configured" });
        const { productName, brand, category } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a professional description for a ${brand} ${productName} in ${category}. 150 words with HTML.`,
        });
        res.json({ text: response.text });
    } catch (err) { res.status(500).json({ error: "AI Error" }); }
});

router.post('/ai/seo', async (req, res) => {
    try {
        if (!ai) return res.status(500).json({ error: "AI not configured" });
        const { productName } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate SEO JSON: metaTitle, metaDescription, keywords for "${productName}".`,
            config: { responseMimeType: "application/json" }
        });
        res.json(JSON.parse(response.text));
    } catch (err) { res.status(500).json({ error: "AI Error" }); }
});

// --- Entity Routes ---

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
router.get('/brands', async (req, res) => { try { res.json(await Brand.find({}).lean() || []); } catch { res.json([]); } });
router.post('/brands', (req, res) => handleUpsert(Brand, req, res));
router.delete('/brands/:id', async (req, res) => { try { await Brand.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Settings
router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne({ id: 'settings' });
        if (!settings) {
            settings = await new Settings({ id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Enterprise Hub' }).save();
        }
        res.json(settings);
    } catch (err) { res.status(500).json({}); }
});
router.post('/settings', (req, res) => handleUpsert(Settings, req, res));

// Pages
router.get('/pages', async (req, res) => { try { res.json(await Page.find({}).sort({ sortOrder: 1 }).lean() || []); } catch { res.json([]); } });
router.post('/pages', (req, res) => handleUpsert(Page, req, res));
router.delete('/pages/:id', async (req, res) => { try { await Page.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Blog
router.get('/blog', async (req, res) => { try { res.json(await BlogPost.find({}).sort({ date: -1 }).lean() || []); } catch { res.json([]); } });
router.post('/blog', (req, res) => handleUpsert(BlogPost, req, res));
router.delete('/blog/:id', async (req, res) => { try { await BlogPost.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Coupons
router.get('/coupons', async (req, res) => { try { res.json(await Coupon.find({}).lean() || []); } catch { res.json([]); } });
router.post('/coupons', (req, res) => handleUpsert(Coupon, req, res));
router.delete('/coupons/:id', async (req, res) => { try { await Coupon.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Orders
router.get('/orders', async (req, res) => { try { res.json(await Order.find({}).sort({ createdAt: -1 }).lean() || []); } catch { res.json([]); } });
router.post('/orders', async (req, res) => {
    try {
        const order = await new Order({ ...req.body, id: `ORD-${Date.now()}` }).save();
        res.json(order);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/orders/:id', (req, res) => handleUpsert(Order, req, res));
router.delete('/orders/:id', async (req, res) => { try { await Order.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Messages & Quotes
router.get('/quotes', async (req, res) => { try { res.json(await Quote.find({}).sort({ createdAt: -1 }).lean() || []); } catch { res.json([]); } });
router.post('/quotes', async (req, res) => { try { res.json(await new Quote({ ...req.body, id: `QT-${Date.now()}`, date: new Date() }).save()); } catch { res.status(500).json({}); } });
router.delete('/quotes/:id', async (req, res) => { try { await Quote.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

router.get('/contact', async (req, res) => { try { res.json(await Contact.find({}).sort({ createdAt: -1 }).lean() || []); } catch { res.json([]); } });
router.post('/contact', async (req, res) => { try { res.json(await new Contact({ ...req.body, id: `MSG-${Date.now()}`, date: new Date() }).save()); } catch { res.status(500).json({}); } });
router.delete('/contact/:id', async (req, res) => { try { await Contact.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Users
router.get('/users', async (req, res) => { try { res.json(await User.find({}).lean() || []); } catch { res.json([]); } });
router.post('/users', (req, res) => handleUpsert(User, req, res, 'email'));

module.exports = router;

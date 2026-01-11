
const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { 
  Product, Order, User, Settings, Category, Brand, Page, 
  Quote, Contact, Coupon, BlogPost 
} = require('./models');

// Fix: Initialize Gemini using strictly process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Secure AI Endpoints ---
router.post('/ai/description', async (req, res) => {
    try {
        const { productName, brand, category } = req.body;
        // Fix: Use ai.models.generateContent directly with the recommended model
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a professional, enterprise-grade e-commerce product description for a ${brand} ${productName} in the ${category} category. 
            Focus on reliability, performance, and scalability. 
            Use HTML tags like <strong> and <ul> for formatting. 
            Keep it between 150-250 words.`,
        });
        // Fix: Access response.text property directly
        res.json({ text: response.text });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/seo', async (req, res) => {
    try {
        const { productName, description } = req.body;
        // Fix: Use ai.models.generateContent directly with the recommended model
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate SEO metadata for a product named "${productName}". 
            Description context: ${description.substring(0, 200)}...
            Return a JSON object with properties: metaTitle, metaDescription, and keywords (comma separated).`,
            config: { responseMimeType: "application/json" }
        });
        // Fix: Access response.text property directly
        res.json(JSON.parse(response.text));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Products ---
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products || []);
  } catch (err) { res.status(500).json([]); }
});

router.get('/products/all', async (req, res) => {
    try {
      const products = await Product.find({});
      res.json(products || []);
    } catch (err) { res.status(500).json([]); }
});

router.post('/products', async (req, res) => {
  try {
    const newProduct = await Product.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
    res.json(newProduct);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/products/:id', async (req, res) => {
    try {
        const updated = await Product.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/products/:id', async (req, res) => {
    try {
        await Product.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Categories ---
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ sortOrder: 1 });
        res.json(categories || []);
    } catch (err) { res.status(500).json([]); }
});

router.post('/categories', async (req, res) => {
    try {
        const cat = await Category.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
        res.json(cat);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        await Category.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Settings ---
router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne({ id: 'settings' });
        if (!settings) {
            settings = await new Settings({ 
                id: 'settings',
                supportPhone: '+91 000 000 0000',
                supportEmail: 'support@serverpro.com',
                address: 'Default Address'
            }).save();
        }
        res.json(settings);
    } catch (err) { res.status(500).json({}); }
});

router.post('/settings', async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate({ id: 'settings' }, req.body, { upsert: true, new: true });
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Quotes ---
router.get('/quotes', async (req, res) => {
    try {
        const quotes = await Quote.find({}).sort({ createdAt: -1 });
        res.json(quotes || []);
    } catch (err) { res.status(500).json([]); }
});

router.post('/quotes', async (req, res) => {
    try {
        const quoteData = { ...req.body };
        if (!quoteData.id) quoteData.id = `QT-${Date.now()}`;
        if (!quoteData.date) quoteData.date = new Date();
        const quote = new Quote(quoteData);
        await quote.save();
        res.json(quote);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/brands', async (req, res) => { try { res.json(await Brand.find({}) || []); } catch { res.json([]); } });
router.post('/brands', async (req, res) => { try { res.json(await Brand.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.get('/pages', async (req, res) => { try { res.json(await Page.find({}).sort({ sortOrder: 1 }) || []); } catch { res.json([]); } });
router.post('/pages', async (req, res) => { try { res.json(await Page.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.get('/contact', async (req, res) => { try { res.json(await Contact.find({}).sort({ createdAt: -1 }) || []); } catch { res.json([]); } });
router.post('/contact', async (req, res) => { try { res.json(await new Contact({ ...req.body, id: req.body.id || `MSG-${Date.now()}`, date: new Date() }).save()); } catch { res.status(500).json({}); } });
router.get('/blog', async (req, res) => { try { res.json(await BlogPost.find({}).sort({ date: -1 }) || []); } catch { res.json([]); } });
router.post('/blog', async (req, res) => { try { res.json(await BlogPost.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.get('/orders', async (req, res) => { try { res.json(await Order.find({}).sort({ createdAt: -1 }) || []); } catch { res.json([]); } });
router.post('/orders', async (req, res) => { try { res.json(await new Order({ ...req.body, id: req.body.id || `ORD-${Date.now()}` }).save()); } catch { res.status(500).json({}); } });

module.exports = router;

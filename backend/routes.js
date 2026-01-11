const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { 
  Product, Order, User, Settings, Category, Brand, Page, 
  Quote, Contact, Coupon, BlogPost 
} = require('./models');

// GUIDELINE: Strictly use process.env.API_KEY for GenAI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Secure AI Endpoints ---
router.post('/ai/description', async (req, res) => {
    try {
        const { productName, brand, category } = req.body;
        // GUIDELINE: Use ai.models.generateContent with latest naming
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a professional, enterprise-grade e-commerce product description for a ${brand} ${productName} in the ${category} category. 
            Focus on reliability, performance, and scalability. 
            Use HTML tags like <strong> and <ul> for formatting. 
            Keep it between 150-250 words.`,
        });
        // GUIDELINE: Access .text property directly
        res.json({ text: response.text });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/seo', async (req, res) => {
    try {
        const { productName, description } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate SEO metadata for a product named "${productName}". 
            Description context: ${description.substring(0, 200)}...
            Return a JSON object with properties: metaTitle, metaDescription, and keywords (comma separated).`,
            config: { responseMimeType: "application/json" }
        });
        res.json(JSON.parse(response.text));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Products (Direct DB priority) ---
router.get('/products/all', async (req, res) => {
    try {
      const products = await Product.find({}).sort({ updatedAt: -1 });
      res.json(products || []);
    } catch (err) { res.status(500).json([]); }
});

router.post('/products', async (req, res) => {
  try {
    const productData = req.body;
    if (!productData.id || productData.id === '') productData.id = `p-${Date.now()}`;
    const newProduct = await Product.findOneAndUpdate({ id: productData.id }, productData, { upsert: true, new: true });
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

router.get('/categories', async (req, res) => {
    try {
        res.json(await Category.find({}).sort({ sortOrder: 1 }) || []);
    } catch (err) { res.status(500).json([]); }
});

router.post('/categories', async (req, res) => {
    try {
        const cat = await Category.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
        res.json(cat);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne({ id: 'settings' });
        if (!settings) {
            settings = await new Settings({ 
                id: 'settings', supportPhone: '+91 000 000 0000', supportEmail: 'support@serverpro.com', address: 'Default Address'
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

// --- Standard CRUD ---
router.get('/quotes', async (req, res) => { try { res.json(await Quote.find({}).sort({ createdAt: -1 }) || []); } catch { res.json([]); } });
router.post('/quotes', async (req, res) => { try { res.json(await new Quote({ ...req.body, id: `QT-${Date.now()}`, date: new Date() }).save()); } catch { res.status(500).json({}); } });
router.get('/orders', async (req, res) => { try { res.json(await Order.find({}).sort({ createdAt: -1 }) || []); } catch { res.json([]); } });
router.post('/orders', async (req, res) => { try { res.json(await new Order({ ...req.body, id: `ORD-${Date.now()}`, date: new Date() }).save()); } catch { res.status(500).json({}); } });
router.get('/pages', async (req, res) => { try { res.json(await Page.find({}).sort({ sortOrder: 1 }) || []); } catch { res.json([]); } });
router.post('/pages', async (req, res) => { try { res.json(await Page.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.delete('/pages/:id', async (req, res) => { try { await Page.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });
router.get('/brands', async (req, res) => { try { res.json(await Brand.find({}) || []); } catch { res.json([]); } });
router.post('/brands', async (req, res) => { try { res.json(await Brand.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.get('/blog', async (req, res) => { try { res.json(await BlogPost.find({}).sort({ date: -1 }) || []); } catch { res.json([]); } });
router.post('/blog', async (req, res) => { try { res.json(await BlogPost.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });

module.exports = router;
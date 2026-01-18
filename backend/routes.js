
const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const { 
  Product, Order, User, Settings, Category, Brand, Page, 
  Quote, Contact, Coupon, BlogPost 
} = require('./models');
const mongoose = require('mongoose');

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// AI Proxy Routes
router.post('/ai/description', async (req, res) => {
    try {
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
        const { productName, description } = req.body;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate SEO JSON: metaTitle, metaDescription, keywords for "${productName}".`,
            config: { responseMimeType: "application/json" }
        });
        res.json(JSON.parse(response.text));
    } catch (err) { res.status(500).json({ error: "AI Error" }); }
});

// Products Routes
router.get('/products/all', async (req, res) => {
    try {
      const products = await Product.find({}).sort({ updatedAt: -1 }).lean();
      res.json(products || []);
    } catch (err) { res.status(500).json([]); }
});

router.post('/products', async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) data.id = `p-${Date.now()}`;
    const newProduct = await Product.findOneAndUpdate({ id: data.id }, data, { upsert: true, new: true });
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
        // Double-check: delete by custom id field or Mongo _id
        const result = await Product.deleteOne({ id: req.params.id });
        if (result.deletedCount === 0 && mongoose.Types.ObjectId.isValid(req.params.id)) {
            await Product.deleteOne({ _id: req.params.id });
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Category Routes
router.get('/categories', async (req, res) => {
    try {
        const cats = await Category.find({}).sort({ sortOrder: 1 }).lean();
        res.json(cats || []);
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

// Brand Routes
router.get('/brands', async (req, res) => { try { res.json(await Brand.find({}).lean() || []); } catch { res.json([]); } });
router.post('/brands', async (req, res) => { try { res.json(await Brand.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.delete('/brands/:id', async (req, res) => { try { await Brand.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

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

router.post('/settings', async (req, res) => {
    try {
        const settings = await Settings.findOneAndUpdate({ id: 'settings' }, req.body, { upsert: true, new: true });
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CMS Pages
router.get('/pages', async (req, res) => { try { res.json(await Page.find({}).sort({ sortOrder: 1 }).lean() || []); } catch { res.json([]); } });
router.post('/pages', async (req, res) => { try { res.json(await Page.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.delete('/pages/:id', async (req, res) => { try { await Page.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Blog Posts
router.get('/blog', async (req, res) => { try { res.json(await BlogPost.find({}).sort({ date: -1 }).lean() || []); } catch { res.json([]); } });
router.post('/blog', async (req, res) => { try { res.json(await BlogPost.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.delete('/blog/:id', async (req, res) => { try { await BlogPost.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Orders
router.get('/orders', async (req, res) => { try { res.json(await Order.find({}).sort({ createdAt: -1 }).lean() || []); } catch { res.json([]); } });
router.post('/orders', async (req, res) => { try { res.json(await new Order({ ...req.body, id: `ORD-${Date.now()}` }).save()); } catch { res.status(500).json({}); } });
router.put('/orders/:id', async (req, res) => { try { res.json(await Order.findOneAndUpdate({ id: req.params.id }, req.body, { new: true })); } catch { res.status(500).json({}); } });
router.delete('/orders/:id', async (req, res) => { try { await Order.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Quotes
router.get('/quotes', async (req, res) => { try { res.json(await Quote.find({}).sort({ createdAt: -1 }).lean() || []); } catch { res.json([]); } });
router.post('/quotes', async (req, res) => { try { res.json(await new Quote({ ...req.body, id: `QT-${Date.now()}`, date: new Date() }).save()); } catch { res.status(500).json({}); } });
router.delete('/quotes/:id', async (req, res) => { try { await Quote.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Messages
router.get('/contact', async (req, res) => { try { res.json(await Contact.find({}).sort({ createdAt: -1 }).lean() || []); } catch { res.json([]); } });
router.post('/contact', async (req, res) => { try { res.json(await new Contact({ ...req.body, id: `MSG-${Date.now()}`, date: new Date() }).save()); } catch { res.status(500).json({}); } });
router.delete('/contact/:id', async (req, res) => { try { await Contact.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Coupons
router.get('/coupons', async (req, res) => { try { res.json(await Coupon.find({}).lean() || []); } catch { res.json([]); } });
router.post('/coupons', async (req, res) => { try { res.json(await Coupon.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });
router.delete('/coupons/:id', async (req, res) => { try { await Coupon.deleteOne({ id: req.params.id }); res.json({ success: true }); } catch { res.status(500).json({}); } });

// Users
router.get('/users', async (req, res) => { try { res.json(await User.find({}).lean() || []); } catch { res.json([]); } });
router.post('/users', async (req, res) => { try { res.json(await User.findOneAndUpdate({ email: req.body.email }, req.body, { upsert: true, new: true })); } catch { res.status(500).json({}); } });

module.exports = router;

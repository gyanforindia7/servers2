
const express = require('express');
const router = express.Router();
const { 
  Product, Order, User, Settings, Category, Brand, Page, 
  Quote, Contact, Coupon, BlogPost 
} = require('./models');

// --- Products ---
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    res.json(products || []);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/products/all', async (req, res) => {
    try {
      const products = await Product.find({});
      res.json(products || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
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
    } catch (err) { res.status(500).json({ error: err.message }); }
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

// --- Brands ---
router.get('/brands', async (req, res) => {
    try {
        const brands = await Brand.find({});
        res.json(brands || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/brands', async (req, res) => {
    try {
        const brand = await Brand.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
        res.json(brand);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/brands/:id', async (req, res) => {
    try {
        await Brand.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Pages ---
router.get('/pages', async (req, res) => {
    try {
        const pages = await Page.find({}).sort({ sortOrder: 1 });
        res.json(pages || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pages', async (req, res) => {
    try {
        const page = await Page.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
        res.json(page);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/pages/:id', async (req, res) => {
    try {
        await Page.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Orders ---
router.post('/orders', async (req, res) => {
  try {
    const order = new Order({ ...req.body, id: `ORD-${Date.now()}` });
    await order.save();
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/orders/:id/status', async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate({ id: req.params.id }, { status: req.body.status }, { new: true });
        res.json(order);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/orders/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate({ id: req.params.id }, { status: 'Cancelled', cancellationReason: req.body.reason }, { new: true });
        res.json(order);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/orders/:id', async (req, res) => {
    try {
        await Order.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Settings ---
router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne({ id: 'settings' });
        if (!settings) {
            // Create default settings if database is empty
            settings = await new Settings({ 
                id: 'settings',
                supportPhone: '+91 000 000 0000',
                supportEmail: 'support@serverpro.com',
                address: 'Your Address Here',
                whatsappNumber: '+910000000000'
            }).save();
        }
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
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
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/quotes', async (req, res) => {
    try {
        const quote = new Quote({ ...req.body, id: `QT-${Date.now()}`, date: new Date() });
        await quote.save();
        res.json(quote);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/quotes/:id/status', async (req, res) => {
    try {
        const quote = await Quote.findOneAndUpdate({ id: req.params.id }, { status: req.body.status }, { new: true });
        res.json(quote);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/quotes/:id', async (req, res) => {
    try {
        await Quote.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Contact Messages ---
router.get('/contact', async (req, res) => {
    try {
        const msgs = await Contact.find({}).sort({ createdAt: -1 });
        res.json(msgs || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/contact', async (req, res) => {
    try {
        const msg = new Contact({ ...req.body, id: `MSG-${Date.now()}`, date: new Date() });
        await msg.save();
        res.json(msg);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/contact/:id/read', async (req, res) => {
    try {
        const msg = await Contact.findOneAndUpdate({ id: req.params.id }, { status: 'Read' }, { new: true });
        res.json(msg);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/contact/:id', async (req, res) => {
    try {
        await Contact.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Users ---
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/users', async (req, res) => {
    try {
        const user = await User.findOneAndUpdate({ email: req.body.email }, req.body, { upsert: true, new: true });
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Blog ---
router.get('/blog', async (req, res) => {
    try {
        const posts = await BlogPost.find({}).sort({ date: -1 });
        res.json(posts || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/blog', async (req, res) => {
    try {
        const post = await BlogPost.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
        res.json(post);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/blog/:id', async (req, res) => {
    try {
        await BlogPost.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Coupons ---
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find({});
        res.json(coupons || []);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/coupons', async (req, res) => {
    try {
        const coupon = await Coupon.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
        res.json(coupon);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/coupons/:id', async (req, res) => {
    try {
        await Coupon.deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

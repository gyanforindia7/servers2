
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes');
const { Product, Category } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

/**
 * CACHE INVALIDATION MIDDLEWARE
 * Forces staging environments and browsers to bypass CDNs/Cache for API requests.
 */
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
}, apiRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        dbConnected: mongoose.connection.readyState === 1,
        env: process.env.NODE_ENV
    });
});

// Database Auto-Seeding (Only if truly empty)
const seedDatabase = async () => {
    try {
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            console.log('Seeding default categories...');
            const categoryNames = ['Servers', 'Storage', 'Workstations', 'Laptops', 'Option & Spares'];
            const categories = categoryNames.map((name, i) => ({
                id: `cat-${i+1}`,
                name,
                slug: name.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'),
                showOnHome: true, showInMenu: true, showInFooter: true, sortOrder: i
            }));
            await Category.insertMany(categories);
        }

        const prodCount = await Product.countDocuments();
        if (prodCount === 0) {
            console.log('Seeding initial products...');
            const initialProducts = [
                {
                    id: 'p1', name: 'Dell PowerEdge R750', slug: 'dell-poweredge-r750', sku: 'DELL-R750-001',
                    category: 'Servers', brand: 'Dell', price: 375000, stock: 10, isActive: true, condition: 'New',
                    imageUrl: 'https://picsum.photos/seed/server1/400/300',
                    description: 'The Dell EMC PowerEdge R750 is a full-featured enterprise server.',
                    specs: { 'CPU': '2x Intel Xeon Gold', 'RAM': '64GB DDR4', 'Form Factor': '2U Rack' }
                }
            ];
            await Product.insertMany(initialProducts);
        }
    } catch (err) {
        console.error('Seeding Error:', err);
    }
};

const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB Connected');
    seedDatabase();
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
  });
}

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server live on port ${PORT}`);
});

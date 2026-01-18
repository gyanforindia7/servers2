
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

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        dbConnected: mongoose.connection.readyState === 1,
        env: process.env.NODE_ENV
    });
});

// Database Auto-Seeding
const seedDatabase = async () => {
    try {
        // Seed Categories
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            console.log('Database empty. Seeding defaults for first-time setup...');
            const categoryNames = ['Servers', 'Storage', 'Workstations', 'Laptops', 'Option & Spares'];
            const categories = categoryNames.map((name, i) => ({
                id: `cat-${i+1}`,
                name,
                slug: name.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'),
                showOnHome: true,
                showInMenu: true,
                showInFooter: true,
                sortOrder: i
            }));
            await Category.insertMany(categories);
            console.log('Default categories seeded.');
        }

        // Seed Products if none exist to match frontend INITIAL_PRODUCTS
        const prodCount = await Product.countDocuments();
        if (prodCount === 0) {
            console.log('No products found. Seeding initial product catalog...');
            const initialProducts = [
                {
                    id: 'p1', name: 'Dell PowerEdge R750', slug: 'dell-poweredge-r750', sku: 'DELL-R750-001',
                    category: 'Servers', brand: 'Dell', price: 375000, stock: 10, isActive: true, condition: 'New',
                    imageUrl: 'https://picsum.photos/seed/server1/400/300',
                    description: 'The Dell EMC PowerEdge R750 is a full-featured enterprise server.',
                    specs: { 'CPU': '2x Intel Xeon Gold', 'RAM': '64GB DDR4', 'Form Factor': '2U Rack' }
                },
                {
                    id: 'p2', name: 'HPE ProLiant DL380 Gen10', slug: 'hpe-proliant-dl380-gen10', sku: 'HPE-DL380-G10',
                    category: 'Servers', brand: 'HP', price: 325000, stock: 15, isActive: true, condition: 'Refurbished',
                    imageUrl: 'https://picsum.photos/seed/server2/400/300',
                    description: 'Adaptable for diverse workloads and environments.',
                    specs: { 'CPU': 'Intel Xeon Silver', 'RAM': '32GB DDR4', 'Form Factor': '2U Rack' }
                }
            ];
            await Product.insertMany(initialProducts);
            console.log('Initial products seeded.');
        }
    } catch (err) {
        console.error('Seeding Error:', err);
    }
};

const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  mongoose.connect(mongoUri)
  .then(() => {
    console.log('SUCCESS: MongoDB Connected to ' + mongoUri.split('@')[1] || 'database');
    seedDatabase();
  })
  .catch(err => {
    console.error('CRITICAL: MongoDB Connection Error. Data will not persist!', err);
  });
} else {
    console.warn('WARNING: MONGO_URI missing from environment. Data will NOT persist across restarts.');
}

app.use('/api', apiRoutes);

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
} else {
    console.log('Running in Development mode. Backend API is ready on port ' + PORT);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is now live on http://localhost:${PORT}`);
});

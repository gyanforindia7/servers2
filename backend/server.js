
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

// Health Check (Top level)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        dbConnected: mongoose.connection.readyState === 1,
        time: new Date().toISOString()
    });
});

/**
 * API ROUTE MOUNTING
 * We mount this BEFORE static files to ensure /api/ endpoints are never 404'd by the index.html fallback.
 */
app.use('/api', apiRoutes);

// Database Auto-Seeding Logic
const seedDatabase = async () => {
    try {
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            console.log('Database empty. Seeding Categories...');
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
            console.log('Database empty. Seeding Initial Products...');
            const initialProducts = [
                {
                    id: 'p1', name: 'Dell PowerEdge R750', slug: 'dell-poweredge-r750', sku: 'DELL-R750-001',
                    category: 'Servers', brand: 'Dell', price: 375000, stock: 10, isActive: true, condition: 'New',
                    imageUrl: 'https://picsum.photos/seed/server1/400/300', isFeatured: true,
                    description: 'The Dell EMC PowerEdge R750 is a full-featured enterprise server.',
                    specs: { 'CPU': '2x Intel Xeon Gold', 'RAM': '64GB DDR4', 'Form Factor': '2U Rack' }
                },
                {
                    id: 'p2', name: 'HPE ProLiant DL380 Gen10', slug: 'hpe-proliant-dl380-gen10', sku: 'HPE-DL380-G10',
                    category: 'Servers', brand: 'HP', price: 325000, stock: 15, isActive: true, condition: 'Refurbished',
                    imageUrl: 'https://picsum.photos/seed/server2/400/300', isFeatured: true,
                    description: 'Adaptable for diverse workloads, the secure HPE ProLiant DL380 Gen10 delivers world-class performance.',
                    specs: { 'CPU': 'Intel Xeon Silver', 'RAM': '32GB DDR4', 'Form Factor': '2U Rack' }
                },
                {
                    id: 'p3', name: 'Lenovo ThinkPad X1 Carbon Gen 10', slug: 'lenovo-thinkpad-x1-carbon-gen-10', sku: 'LEN-X1-G10',
                    category: 'Laptops', brand: 'Lenovo', price: 158000, stock: 50, isActive: true, condition: 'New',
                    imageUrl: 'https://picsum.photos/seed/laptop1/400/300', isFeatured: true, allowDirectBuy: true,
                    description: 'Our flagship business laptop. Powered by 12th Gen Intel Core processors.',
                    specs: { 'CPU': 'i7-1260P', 'RAM': '16GB', 'SSD': '512GB NVMe' }
                },
                {
                    id: 'p5', name: 'Dell Precision 7920 Tower', slug: 'dell-precision-7920-tower', sku: 'DELL-PREC-7920',
                    category: 'Workstations', brand: 'Dell', price: 285000, stock: 5, isActive: true, condition: 'Refurbished',
                    imageUrl: 'https://picsum.photos/seed/workstation1/400/300', isFeatured: true,
                    description: 'The world\'s most powerful workstation. Ready for AI and VR.',
                    specs: { 'CPU': 'Xeon Gold 6200', 'GPU': 'NVIDIA RTX A4000', 'RAM': '128GB' }
                }
            ];
            await Product.insertMany(initialProducts);
        }
    } catch (err) {
        console.error('Seeding process encountered an issue:', err.message);
    }
};

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if (mongoUri) {
  mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB Connected successfully');
    seedDatabase();
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
  });
}

// Static File Serving (Fallback)
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        // Only fallback to index.html if it's NOT an API call
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            res.status(404).json({ error: 'Endpoint not found on API router' });
        }
    });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Enterprise Backend Server is live on port ${PORT}`);
});

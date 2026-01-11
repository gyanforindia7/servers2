const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes');
const { Product, Category } = require('./models');
require('dotenv').config();

const app = express();
// Priority: Process env PORT (Cloud) or 8080
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        dbConnected: mongoose.connection.readyState === 1
    });
});

// Database Auto-Seeding
const seedDatabase = async () => {
    try {
        const catCount = await Category.countDocuments();
        if (catCount === 0) {
            console.log('Database empty. Seeding defaults...');
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
            
            const products = [
                {
                    id: 'p1',
                    name: 'Dell PowerEdge R750',
                    slug: 'dell-poweredge-r750',
                    sku: 'DELL-R750-001',
                    category: 'Servers',
                    brand: 'Dell',
                    description: 'Enterprise grade 2U rack server.',
                    price: 375000,
                    specs: { 'CPU': 'Intel Xeon', 'RAM': '64GB' },
                    stock: 10,
                    imageUrl: 'https://picsum.photos/seed/server1/800/600',
                    isActive: true
                }
            ];
            await Product.insertMany(products);
            console.log('Seeding complete.');
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
  .catch(err => console.error('MongoDB Connection Error:', err));
} else {
    console.warn('WARNING: MONGO_URI missing. Using local fallback mode.');
}

// API Routes
app.use('/api', apiRoutes);

// Production Static Serving
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
} else {
    console.log('Production build folder not found. Serving API only.');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
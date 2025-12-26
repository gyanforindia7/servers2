
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes');
const { Product, Category } = require('./models');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running', timestamp: new Date() });
});

// Database Connection & Auto-Seeding
const mongoUri = process.env.MONGO_URI;

const seedDatabase = async () => {
    try {
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.log('Database empty. Seeding initial data...');
            
            // Initial Categories
            const categoryNames = ['Servers', 'Storage', 'Workstations', 'Laptops', 'Option & Spares'];
            const categories = categoryNames.map((name, i) => ({
                id: `cat-${i+1}`,
                name: name,
                slug: name.toLowerCase().replace(/ /g, '-').replace(/&/g, 'and'),
                showOnHome: true,
                showInMenu: true,
                showInFooter: true,
                sortOrder: i
            }));
            await Category.insertMany(categories);

            // Initial Products
            const products = [
                {
                    id: 'p1',
                    name: 'Dell PowerEdge R750',
                    slug: 'dell-poweredge-r750',
                    sku: 'DELL-R750-001',
                    category: 'Servers',
                    brand: 'Dell',
                    description: 'The Dell EMC PowerEdge R750 is a full-featured enterprise server.',
                    price: 375000,
                    specs: { 'CPU': '2x Intel Xeon Gold', 'RAM': '64GB DDR4' },
                    stock: 10,
                    imageUrl: 'https://picsum.photos/seed/server1/800/600',
                    condition: 'New',
                    isActive: true
                },
                {
                    id: 'p3',
                    name: 'Lenovo ThinkPad X1 Carbon',
                    slug: 'lenovo-thinkpad-x1',
                    sku: 'LEN-X1-G10',
                    category: 'Laptops',
                    brand: 'Lenovo',
                    description: 'Our flagship business laptop.',
                    price: 158000,
                    specs: { 'CPU': 'i7-1260P', 'RAM': '16GB' },
                    stock: 50,
                    imageUrl: 'https://picsum.photos/seed/laptop1/800/600',
                    condition: 'New',
                    isActive: true,
                    allowDirectBuy: true
                }
            ];
            await Product.insertMany(products);
            console.log('Seeding complete.');
        }
    } catch (err) {
        console.error('Seeding Error:', err);
    }
};

if (mongoUri) {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB Connected');
    seedDatabase();
  })
  .catch(err => console.error('MongoDB Connection Error:', err));
} else {
    console.warn('MONGO_URI not found. Backend will run but data may not be persistent.');
}

// API Routes
app.use('/api', apiRoutes);

// Production Static Files Serving
// This block ensures the app works correctly on Google Cloud Run
if (process.env.NODE_ENV === 'production' || process.env.PORT) {
  // Since this file is in /backend, we go up one level to the root where /dist lives
  const distPath = path.resolve(__dirname, '..', 'dist');
  
  // Serve static files (js, css, images) from the dist folder
  app.use(express.static(distPath));
  
  // SPA logic: Any request that doesn't match an API route or a static file 
  // should serve index.html so the React Router can take over.
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return; // Fall through for API errors
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global 404 for API endpoints that are not handled by apiRoutes
app.use('/api/*', (req, res) => {
    res.status(404).json({ 
        error: 'Not Found', 
        message: `API endpoint ${req.originalUrl} does not exist.` 
    });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

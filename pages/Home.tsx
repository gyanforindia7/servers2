import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
// Fix: Destructure from namespace import with any cast to resolve environment export issues
const { Link } = ReactRouterDOM as any;
import { SEO } from '../components/SEO';
import { FileText, Server, HardDrive, Laptop, Cpu, ArrowRight, CheckCircle, Phone, Truck } from '../components/Icons';
import { getCategories, getProducts } from '../services/db';
import { ProductCard } from '../components/ProductCard';
import { useApp } from '../App';
import { Category, Product } from '../types';

export const Home: React.FC = () => {
  const { categories: globalCategories, openQuoteModal, settings, isDataLoaded } = useApp();
  const homeCategories = globalCategories.filter(c => c.showOnHome !== false).slice(0, 5);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SERVERS 2",
    "url": window.location.origin,
    "logo": settings.logoUrl || "",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings.supportPhone,
      "contactType": "Sales"
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'Servers': return < Server size={32} />;
      case 'Storage': return <HardDrive size={32} />;
      case 'Workstations': return <Cpu size={32} />;
      case 'Laptops': return <Laptop size={32} />;
      default: return <Server size={32} />;
    }
  };

  return (
    <>
      <SEO 
        title={settings.homeSeo?.metaTitle || "Home"} 
        description={settings.homeSeo?.metaDescription || "Enterprise IT hardware supplier."} 
      />
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      
      {/* Hero Section */}
      <section className="relative bg-slate-900 dark:bg-black text-white overflow-hidden min-h-[450px] md:min-h-[600px] flex items-center transition-all duration-700">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 grayscale-[0.5] dark:grayscale"
          style={{ 
            backgroundImage: `url('${settings.bannerUrl || 'https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=2071&auto=format&fit=crop'}')`,
            opacity: 0.4
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 dark:from-black via-slate-900/90 dark:via-black/90 to-transparent"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-block bg-blue-600/30 border border-blue-500/50 text-blue-200 text-[10px] md:text-xs font-bold px-3 py-1 rounded-full mb-6 backdrop-blur-sm uppercase tracking-widest">
              PREMIUM HARDWARE • GLOBAL SHIPPING
            </div>
            <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              Enterprise <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 uppercase">Computing Power</span>
            </h1>
            <p className="text-base md:text-xl text-slate-300 dark:text-slate-400 mb-8 max-w-xl leading-relaxed">
              New and certified refurbished hardware for high-performance workloads. Fully tested with enterprise warranties.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => openQuoteModal()} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 hover:-translate-y-1 uppercase tracking-tight"
              >
                <FileText size={20} /> Request a Quote
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Shop by Category</h2>
              <div className="w-12 h-1 bg-blue-600 mt-2"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
            {homeCategories.map(cat => (
               <Link key={cat.id} to={`/category/${cat.slug}`} className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-200 dark:border-slate-800">
                 <div className="absolute inset-0">
                   {cat.imageUrl ? (
                     <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                   ) : (
                     <div className="w-full h-full bg-slate-800"></div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70 group-hover:opacity-85 transition-opacity"></div>
                 </div>
                 
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <div className="text-white mb-2 transform group-hover:-translate-y-2 transition-transform duration-300 drop-shadow-lg">
                      {getCategoryIcon(cat.name)}
                    </div>
                    <span className="font-bold text-white text-xs md:text-lg uppercase tracking-wider transform group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-lg">
                      {cat.name}
                    </span>
                 </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Category Product Grids - Updated Grid for Mobile (2 items) */}
      {homeCategories.map((category) => (
          <CategoryProductGrid key={category.id} category={category} />
      ))}

      {/* Trust Features */}
      <section className="py-12 md:py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
             {[
               { icon: <CheckCircle size={24}/>, title: "Certified Hardware", desc: "Rigorous 25-point testing" },
               { icon: <Phone size={24}/>, title: "Expert Support", desc: "Technical engineers available" },
               { icon: <Truck size={24}/>, title: "Global Logistics", desc: "Secure worldwide shipping" },
               { icon: <Server size={24}/>, title: "Standard Warranty", desc: "Included on all systems" }
             ].map((feature, i) => (
               <div key={i} className="flex flex-col items-center text-center group">
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg border border-slate-100 dark:border-slate-800">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-xl mb-1">{feature.title}</h3>
                  <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400">{feature.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>
    </>
  );
};

const CategoryProductGrid: React.FC<{ category: Category }> = ({ category }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const { categories } = useApp();
    
    useEffect(() => {
        const loadProducts = async () => {
            const allProducts = await getProducts();
            
            // Recursive function to get all subcategory names
            const getChildCategoryNames = (parentId: string): string[] => {
                const children = categories.filter(c => c.parentId === parentId);
                let names = children.map(c => c.name);
                children.forEach(child => {
                  names = [...names, ...getChildCategoryNames(child.id)];
                });
                return names;
            };

            const targetCategories = [category.name, ...getChildCategoryNames(category.id)];
            const result = allProducts.filter(p => targetCategories.includes(p.category) && p.isActive !== false);
            
            setProducts(result.slice(0, 10));
        };
        loadProducts();
    }, [category.name, category.id, categories]);

    if (products.length === 0) return null;

    return (
        <section className="py-12 md:py-16 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
            <div className="container mx-auto px-4">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tighter">
                    <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                    {category.name}
                  </h2>
                </div>
                <Link 
                  to={`/category/${category.slug}`} 
                  className="group flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline uppercase tracking-tight"
                >
                  View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                </Link>
              </div>

              {/* Mobile: grid-cols-2 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
        </section>
    );
};
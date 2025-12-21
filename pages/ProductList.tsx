
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getProducts, getBrands, getCategoryBySlug } from '../services/db';
import { Product, Category, Brand } from '../types';
import { SEO } from '../components/SEO';
import { ProductCard } from '../components/ProductCard';
import { ChevronDown, ChevronUp, Filter, X, Check } from '../components/Icons';

export const ProductList: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | undefined>(undefined);
  
  // Filter States
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string[]>>({});
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  
  // Mobile Filter Drawer
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Initial Load
  useEffect(() => {
    const loadData = async () => {
        // Only fetch active products for the frontend
        const allProducts = (await getProducts()).filter(p => p.isActive !== false);
        const brands = await getBrands();
        setAvailableBrands(brands);
        
        let initialList = allProducts;
        
        if (categorySlug) {
          const cat = await getCategoryBySlug(categorySlug);
          setCurrentCategory(cat);
          if (cat) {
            // Filter by exact category name
            initialList = allProducts.filter(p => p.category === cat.name);
          }
        } else if (searchQuery) {
            // Text Search
            const lowerQ = searchQuery.toLowerCase();
            initialList = allProducts.filter(p => 
                p.name.toLowerCase().includes(lowerQ) ||
                p.category.toLowerCase().includes(lowerQ) ||
                p.brand.toLowerCase().includes(lowerQ) ||
                p.sku.toLowerCase().includes(lowerQ) ||
                p.description.toLowerCase().includes(lowerQ)
            );
            setCurrentCategory(undefined);
        } else {
          setCurrentCategory(undefined);
        }

        setProducts(initialList);
        setFilteredProducts(initialList);

        // Generate Dynamic Spec Filters
        const specsMap: Record<string, Set<string>> = {};
        initialList.forEach(p => {
          Object.entries(p.specs).forEach(([key, val]) => {
            if (!specsMap[key]) specsMap[key] = new Set();
            specsMap[key].add(val);
          });
        });
        
        // Only keep specs that have more than 1 option to filter by
        const finalSpecs: Record<string, string[]> = {};
        Object.entries(specsMap).forEach(([key, set]) => {
          if (set.size > 1) finalSpecs[key] = Array.from(set);
        });
        setDynamicFilters(finalSpecs);

        // Reset filters when category/search changes
        setSelectedBrands([]);
        setPriceRange([0, 1000000]);
        setSelectedSpecs({});
    };
    loadData();
  }, [categorySlug, searchQuery]);

  // Apply Filters
  useEffect(() => {
    let result = products;

    // Brand Filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Price Filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Spec Filters
    Object.entries(selectedSpecs).forEach(([key, values]: [string, string[]]) => {
      if (values.length > 0) {
        result = result.filter(p => p.specs[key] && values.includes(p.specs[key]));
      }
    });

    setFilteredProducts(result);
  }, [products, selectedBrands, priceRange, selectedSpecs]);

  const toggleBrand = (brandName: string) => {
    setSelectedBrands((prev: string[]) => 
      prev.includes(brandName) ? prev.filter(b => b !== brandName) : [...prev, brandName]
    );
  };

  const toggleSpec = (key: string, value: string) => {
    setSelectedSpecs((prev: Record<string, string[]>) => {
      const current = prev[key] || [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      if (updated.length === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: updated };
    });
  };

  const categoryName = currentCategory ? currentCategory.name : (searchQuery ? `Search Results for "${searchQuery}"` : 'All Products');
  const description = currentCategory?.description || (searchQuery ? `Found ${products.length} items matching your search.` : 'Browse our complete catalog of enterprise IT hardware.');
  const pageTitle = currentCategory?.seo?.metaTitle || categoryName;
  const pageDesc = currentCategory?.seo?.metaDescription || description;

  // Filter Content Component to avoid duplication
  const FilterContent = () => (
    <div className="space-y-6">
       {/* Brands */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Brands</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {availableBrands.map(brand => (
            <label key={brand.id} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedBrands.includes(brand.name) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                {selectedBrands.includes(brand.name) && <Check size={12} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={selectedBrands.includes(brand.name)} onChange={() => toggleBrand(brand.name)} />
              <span className="text-sm text-slate-700">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Price Range</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              className="w-full p-2 border border-slate-300 rounded text-sm" 
              placeholder="Min"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            />
            <span className="text-slate-400">-</span>
            <input 
              type="number" 
              className="w-full p-2 border border-slate-300 rounded text-sm" 
              placeholder="Max"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            />
          </div>
          <div className="text-xs text-slate-500 text-center">
            INR {priceRange[0].toLocaleString()} - INR {priceRange[1].toLocaleString()}
          </div>
        </div>
      </div>

      {/* Dynamic Specs */}
      {Object.entries(dynamicFilters).map(([key, values]: [string, string[]]) => (
        <div key={key} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">{key}</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {values.map(val => (
              <label key={val} className="flex items-center gap-3 cursor-pointer group">
                 <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedSpecs[key]?.includes(val) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                    {selectedSpecs[key]?.includes(val) && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={selectedSpecs[key]?.includes(val) || false} onChange={() => toggleSpec(key, val)} />
                <span className="text-sm text-slate-700">{val}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <SEO title={pageTitle} description={pageDesc} />
      
      {/* Category Header */}
      <div className="bg-white border-b border-slate-200 py-6 md:py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{categoryName}</h1>
          <div className="relative">
            <p className={`text-sm md:text-base text-slate-600 max-w-4xl leading-relaxed whitespace-pre-wrap ${!isDescExpanded && 'line-clamp-2'}`}>
              {description}
            </p>
            {description.length > 150 && (
              <button 
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="text-blue-600 text-sm font-semibold mt-2 flex items-center gap-1 hover:underline"
              >
                {isDescExpanded ? <>Read Less <ChevronUp size={14} /></> : <>Read More <ChevronDown size={14} /></>}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          
          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-6">
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              <Filter size={18} /> Filter & Sort
            </button>
          </div>

          {/* Mobile Filter Drawer (Slide-over) */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
              <div className="relative w-[300px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <h3 className="font-bold text-slate-900 flex items-center gap-2"><Filter size={18} /> Filters</h3>
                   <button onClick={() => setShowMobileFilters(false)} className="p-2 text-slate-500 hover:text-red-500 bg-white rounded-full border border-slate-200">
                     <X size={20} />
                   </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                  <FilterContent />
                </div>
                <div className="p-4 border-t border-slate-100 bg-white">
                  <button onClick={() => setShowMobileFilters(false)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">
                    View {filteredProducts.length} Results
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Desktop Sidebar Filters */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
               <FilterContent />
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <div className="text-slate-600 text-sm">
                  Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> results
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-slate-200">
                  <p className="text-slate-500">No products match your filters.</p>
                  <button 
                    onClick={() => { setSelectedBrands([]); setSelectedSpecs({}); setPriceRange([0, 1000000]); }}
                    className="mt-4 text-blue-600 font-semibold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

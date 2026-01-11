
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
// Fix: Destructure from namespace import with any cast to resolve environment export issues
const { useParams, useSearchParams } = ReactRouterDOM as any;
import { getProducts, getBrands, getCategoryBySlug, formatCurrency } from '../services/db';
import { Product, Category, Brand } from '../types';
import { SEO } from '../components/SEO';
import { ProductCard } from '../components/ProductCard';
import { ChevronDown, ChevronUp, Filter, X, Check } from '../components/Icons';
import { useApp } from '../App';

export const ProductList: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const { categories } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000]);
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string[]>>({});
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
          const allProducts = (await getProducts()).filter(p => p.isActive !== false);
          const brandsList = await getBrands();
          setAvailableBrands(brandsList);
          
          let initialList = allProducts;
          
          if (categorySlug) {
            const cat = await getCategoryBySlug(categorySlug);
            setCurrentCategory(cat);
            if (cat) {
              // Recursive function to get all subcategory names
              const getChildCategoryNames = (parentId: string): string[] => {
                const children = categories.filter(c => c.parentId === parentId);
                let names = children.map(c => c.name);
                children.forEach(child => {
                  names = [...names, ...getChildCategoryNames(child.id)];
                });
                return names;
              };

              const targetCategories = [cat.name, ...getChildCategoryNames(cat.id)];
              initialList = allProducts.filter(p => targetCategories.includes(p.category));
            } else {
              initialList = [];
            }
          } else if (searchQuery) {
              const lowerQ = searchQuery.toLowerCase();
              initialList = allProducts.filter(p => 
                  p.name.toLowerCase().includes(lowerQ) ||
                  p.category.toLowerCase().includes(lowerQ) ||
                  p.brand.toLowerCase().includes(lowerQ) ||
                  p.sku.toLowerCase().includes(lowerQ) ||
                  p.description.toLowerCase().includes(lowerQ)
              );
          }

          setProducts(initialList);
          setFilteredProducts(initialList);

          // Generate dynamic spec filters based on current product set
          const specsMap: Record<string, Set<string>> = {};
          initialList.forEach(p => {
            Object.entries(p.specs).forEach(([key, val]) => {
              if (!specsMap[key]) specsMap[key] = new Set();
              specsMap[key].add(val);
            });
          });
          
          const finalSpecs: Record<string, string[]> = {};
          Object.entries(specsMap).forEach(([key, set]) => {
            if (set.size > 1) finalSpecs[key] = Array.from(set);
          });
          setDynamicFilters(finalSpecs);

          // Reset filters when category/search changes
          setSelectedBrands([]);
          setSelectedSpecs({});
        } catch (err) {
          console.error("Error loading products:", err);
        } finally {
          setLoading(false);
        }
    };
    loadData();
  }, [categorySlug, searchQuery, categories]);

  useEffect(() => {
    let result = products;
    if (selectedBrands.length > 0) result = result.filter(p => selectedBrands.includes(p.brand));
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    Object.entries(selectedSpecs).forEach(([key, values]: [string, string[]]) => {
      if (values.length > 0) result = result.filter(p => values.includes(p.specs[key]));
    });
    setFilteredProducts(result);
  }, [products, selectedBrands, priceRange, selectedSpecs]);

  const toggleBrand = (brandName: string) => {
    setSelectedBrands(prev => prev.includes(brandName) ? prev.filter(b => b !== brandName) : [...prev, brandName]);
  };

  const toggleSpec = (key: string, value: string) => {
    setSelectedSpecs(prev => {
      const current = prev[key] || [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      if (updated.length === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: updated };
    });
  };

  const categoryName = currentCategory ? currentCategory.name : (searchQuery ? `Search: "${searchQuery}"` : 'Product Catalog');
  const description = currentCategory?.description || (searchQuery ? `Found ${products.length} results.` : 'Browse our high-performance hardware inventory.');
  const pageTitle = currentCategory?.seo?.metaTitle || categoryName;
  const pageDesc = currentCategory?.seo?.metaDescription || description;

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-xs uppercase tracking-widest">Brands</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {availableBrands.map(brand => (
            <label key={brand.id} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedBrands.includes(brand.name) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-700 group-hover:border-blue-400'}`}>
                {selectedBrands.includes(brand.name) && <Check size={12} className="text-white" />}
              </div>
              <input type="checkbox" className="hidden" checked={selectedBrands.includes(brand.name)} onChange={() => toggleBrand(brand.name)} />
              <span className="text-sm text-slate-700 dark:text-slate-300">{brand.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-xs uppercase tracking-widest">Price (INR)</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-sm dark:bg-slate-950 dark:text-white" placeholder="Min" value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} />
            <span className="text-slate-400">-</span>
            <input type="number" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-sm dark:bg-slate-950 dark:text-white" placeholder="Max" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} />
          </div>
        </div>
      </div>

      {Object.entries(dynamicFilters).map(([key, values]: [string, string[]]) => (
        <div key={key} className="bg-white dark:bg-slate-900 p-5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-xs uppercase tracking-widest">{key}</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {values.map(val => (
              <label key={val} className="flex items-center gap-3 cursor-pointer group">
                 <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${selectedSpecs[key]?.includes(val) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-700 group-hover:border-blue-400'}`}>
                    {selectedSpecs[key]?.includes(val) && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={selectedSpecs[key]?.includes(val) || false} onChange={() => toggleSpec(key, val)} />
                <span className="text-sm text-slate-700 dark:text-slate-300">{val}</span>
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
      
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{categoryName}</h1>
          <div className="relative">
            <p className={`text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-4xl leading-relaxed whitespace-pre-wrap ${!isDescExpanded && 'line-clamp-2'}`}>
              {description}
            </p>
            {description.length > 150 && (
              <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="text-blue-600 dark:text-blue-400 text-sm font-bold mt-2 flex items-center gap-1 hover:underline">
                {isDescExpanded ? <>Read Less <ChevronUp size={14} /></> : <>Read More <ChevronDown size={14} /></>}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="lg:hidden mb-6">
            <button onClick={() => setShowMobileFilters(true)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm">
              <Filter size={18} /> Filters
            </button>
          </div>

          {showMobileFilters && (
            <div className="fixed inset-0 z-[60] flex">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
              <div className="relative w-[280px] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                   <h3 className="font-bold dark:text-white">Filters</h3>
                   <button onClick={() => setShowMobileFilters(false)} className="p-1 text-slate-400"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4"><FilterContent /></div>
                <div className="p-4 border-t dark:border-slate-800"><button onClick={() => setShowMobileFilters(false)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">Apply Filters</button></div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0"><FilterContent /></aside>
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 animate-pulse">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 h-64 rounded-xl border border-slate-200 dark:border-slate-800"></div>
                  ))}
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

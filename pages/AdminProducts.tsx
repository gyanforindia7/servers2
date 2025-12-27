
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getProducts, saveProduct, deleteProduct, getCategories, getBrands, formatCurrency } from '../services/db';
import { generateProductDescription, generateSEOData } from '../services/ai';
import { Product, Category, Brand } from '../types';
import { Plus, Trash2, Settings, Search, Globe, ArrowRight, ShoppingCart, Tag, CheckCircle, Sparkles } from '../components/Icons';
import { ImageUploader } from '../components/ImageUploader';
import { RichTextEditor } from '../components/RichTextEditor';
import { useApp } from '../App';

export const AdminProducts: React.FC = () => {
  const { settings } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filter, setFilter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'seo' | 'gmc'>('basic');

  const initialFormState: Product = {
    id: '',
    name: '',
    slug: '',
    sku: '',
    category: 'Servers',
    price: 0,
    taxRate: 0.18,
    brand: '',
    description: '',
    imageUrl: '',
    stock: 0,
    specs: {},
    additionalSpecs: {},
    condition: 'New',
    allowDirectBuy: false,
    isActive: true,
    seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: 'index, follow', ogImage: '' },
    gmc: { gtin: '', mpn: '', googleProductCategory: '', identifierExists: true }
  };
  const [formData, setFormData] = useState<Product>(initialFormState);
  const [specInput, setSpecInput] = useState({ key: '', value: '' });
  const [addSpecInput, setAddSpecInput] = useState({ key: '', value: '' });

  const refresh = async () => {
    const p = await getProducts();
    const c = await getCategories();
    const b = await getBrands();
    setProducts(p);
    setCategories(c);
    setBrands(b);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAIGenerate = async () => {
    if (!formData.name || !formData.brand) {
        alert("Please enter a product name and brand first.");
        return;
    }
    
    setIsGenerating(true);
    try {
        const description = await generateProductDescription(formData.name, formData.brand, formData.category);
        setFormData(prev => ({ ...prev, description }));
        
        // Also attempt to generate SEO data
        const seoData = await generateSEOData(formData.name, description);
        if (seoData) {
            setFormData(prev => ({
                ...prev,
                seo: {
                    ...prev.seo!,
                    metaTitle: seoData.metaTitle || prev.seo?.metaTitle,
                    metaDescription: seoData.metaDescription || prev.seo?.metaDescription,
                    keywords: seoData.keywords || prev.seo?.keywords
                }
            }));
        }
    } catch (err) {
        alert("AI Generation failed. Ensure your Gemini API Key is correctly configured in your environment.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      ...formData,
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
    };
    await saveProduct(newProduct);
    setView('list');
    setEditingProduct(null);
    refresh();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      refresh();
    }
  };

  const handleStockUpdate = async (product: Product, newStock: number) => {
    const updated = { ...product, stock: newStock };
    await saveProduct(updated);
    refresh();
  };

  const switchToForm = (product?: Product) => {
    setActiveTab('basic');
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        slug: product.slug || '',
        specs: product.specs || {},
        additionalSpecs: product.additionalSpecs || {},
        taxRate: product.taxRate !== undefined ? product.taxRate : 0.18,
        isActive: product.isActive !== undefined ? product.isActive : true,
        seo: { ...initialFormState.seo, ...product.seo },
        gmc: { ...initialFormState.gmc, ...product.gmc },
        allowDirectBuy: product.allowDirectBuy ?? (product.category === 'Laptops')
      });
    } else {
      setEditingProduct(null);
      setFormData({ ...initialFormState, category: categories[0]?.name || 'Servers', brand: brands[0]?.name || 'Dell' });
    }
    setSpecInput({ key: '', value: '' });
    setAddSpecInput({ key: '', value: '' });
    setView('form');
    window.scrollTo(0,0);
  };

  const addSpec = () => {
    if (specInput.key && specInput.value) {
      setFormData({ ...formData, specs: { ...formData.specs, [specInput.key]: specInput.value } });
      setSpecInput({ key: '', value: '' });
    }
  };

  const removeSpec = (key: string) => {
    const newSpecs = { ...formData.specs };
    delete newSpecs[key];
    setFormData({ ...formData, specs: newSpecs });
  };

  const addAdditionalSpec = () => {
    if (addSpecInput.key && addSpecInput.value) {
      setFormData({ ...formData, additionalSpecs: { ...formData.additionalSpecs, [addSpecInput.key]: addSpecInput.value } });
      setAddSpecInput({ key: '', value: '' });
    }
  };

  const removeAdditionalSpec = (key: string) => {
    const newSpecs = { ...formData.additionalSpecs };
    delete newSpecs[key];
    setFormData({ ...formData, additionalSpecs: newSpecs });
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.sku.toLowerCase().includes(filter.toLowerCase()));

  const availableTaxRates = settings.taxRates || [0, 5, 12, 18, 28];

  return (
    <AdminLayout>
      {view === 'list' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Product Management</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage inventory, prices, and SEO</p>
            </div>
            <button onClick={() => switchToForm()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium w-full md:w-auto justify-center">
              <Plus size={18} /> Add Product
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input type="text" placeholder="Search by name or SKU..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-semibold w-20">Image</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-semibold">Product Info</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-semibold">Category</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-semibold">Price</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-semibold w-24">Stock</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-semibold">Status</th>
                    <th className="p-4 text-slate-600 dark:text-slate-400 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                        <div className="w-12 h-12 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        </td>
                        <td className="p-4">
                        <div className="font-medium text-slate-900 dark:text-white">{p.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 font-mono">{p.sku}</div>
                        </td>
                        <td className="p-4">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">{p.category}</span>
                        </td>
                        <td className="p-4 font-medium dark:text-slate-300">{formatCurrency(p.price)}</td>
                        <td className="p-4">
                            <input type="number" className="w-16 p-1 border rounded text-center text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={p.stock} onChange={(e) => handleStockUpdate(p, Number(e.target.value))} onClick={(e) => e.stopPropagation()} />
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => switchToForm(p)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors"><Settings size={16} /></button>
                            <button type="button" onClick={(e) => handleDelete(p.id, e)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition-colors"><Trash2 size={16} /></button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-xl gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="text-slate-500 hover:text-slate-800"><ArrowRight className="rotate-180" size={24} /></button>
              <h3 className="text-xl font-bold dark:text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <button type="button" onClick={() => setView('list')} className="flex-1 md:flex-none px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Cancel</button>
               <button onClick={handleSubmit} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Save Changes</button>
            </div>
          </div>

          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('basic')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'basic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Basic Info</button>
            <button onClick={() => setActiveTab('specs')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'specs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Specs & Media</button>
            <button onClick={() => setActiveTab('seo')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'seo' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>SEO</button>
            <button onClick={() => setActiveTab('gmc')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'gmc' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}><Globe size={14} /> Merchant Center</button>
          </div>
          
          <div className="p-4 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
              {activeTab === 'basic' && (
                <section className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Product Name</label>
                      <input required type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Dell PowerEdge R750" />
                    </div>
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">URL Slug</label>
                        <input type="text" className="w-full p-3 border rounded-lg font-mono text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="auto-generated-from-name" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">SKU</label>
                       <input required type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="DELL-R750-001" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Price (INR)</label>
                       <input required type="number" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">GST / Tax Rate</label>
                        <select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.taxRate !== undefined ? formData.taxRate : 0.18} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})}>
                            {availableTaxRates.map(rate => (
                                <option key={rate} value={rate / 100}>{rate}% GST</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-slate-300">Stock Quantity</label>
                        <input required type="number" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Category</label>
                       <select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                         {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Brand</label>
                       <select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                         {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium mb-1 dark:text-slate-300">Condition</label>
                       <select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as 'New' | 'Refurbished'})}>
                         <option value="New">New</option>
                         <option value="Refurbished">Refurbished</option>
                       </select>
                    </div>
                     <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                         <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                         <div><span className="font-bold text-slate-900 dark:text-white block flex items-center gap-2"><CheckCircle size={16}/> Active Product</span></div>
                       </label>
                       <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                         <input type="checkbox" className="w-5 h-5 accent-blue-600" checked={formData.allowDirectBuy} onChange={e => setFormData({...formData, allowDirectBuy: e.target.checked})} />
                         <div><span className="font-bold text-slate-900 dark:text-white block flex items-center gap-2"><ShoppingCart size={16}/> Enable Direct Buy</span></div>
                       </label>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium dark:text-slate-300">Description</label>
                        <button 
                            type="button" 
                            onClick={handleAIGenerate}
                            disabled={isGenerating}
                            className="text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded-full flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-blue-500/20"
                        >
                            <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                            {isGenerating ? "AI is writing..." : "Generate with AI"}
                        </button>
                      </div>
                      <RichTextEditor value={formData.description} onChange={(val) => setFormData({...formData, description: val})} />
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <section>
                    <h4 className="text-lg font-bold mb-4 border-b dark:border-slate-700 pb-2 dark:text-white">Product Image</h4>
                    <ImageUploader currentImage={formData.imageUrl} onImageChange={(url) => setFormData({...formData, imageUrl: url})} />
                  </section>
                  <section>
                    <h4 className="text-lg font-bold mb-4 border-b dark:border-slate-700 pb-2 dark:text-white">Technical Specifications</h4>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 mb-4">
                      <div className="flex gap-2">
                        <input type="text" placeholder="Key (e.g. RAM)" className="flex-1 p-2 border rounded dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={specInput.key} onChange={e => setSpecInput({...specInput, key: e.target.value})} />
                        <input type="text" placeholder="Value (e.g. 64GB DDR4)" className="flex-1 p-2 border rounded dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={specInput.value} onChange={e => setSpecInput({...specInput, value: e.target.value})} />
                        <button type="button" onClick={addSpec} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">Add</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(formData.specs).map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 border border-slate-200 dark:border-slate-700 rounded transition-colors">
                          <span className="text-sm dark:text-slate-300"><span className="font-bold">{k}:</span> {v}</span>
                          <button type="button" onClick={() => removeSpec(k)} className="text-red-500 hover:text-red-700 ml-2 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'seo' && (
                <section className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-bold flex items-center gap-2 dark:text-white"><Search size={20} /> Advanced SEO</h4>
                    <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full font-bold uppercase">AI Optimized</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Meta Title</label>
                      <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.metaTitle} onChange={e => setFormData({...formData, seo: {...formData.seo!, metaTitle: e.target.value}})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Meta Description</label>
                      <textarea className="w-full p-3 border rounded-lg h-20 dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.metaDescription} onChange={e => setFormData({...formData, seo: {...formData.seo!, metaDescription: e.target.value}})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Keywords</label>
                      <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.keywords} onChange={e => setFormData({...formData, seo: {...formData.seo!, keywords: e.target.value}})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Canonical URL</label>
                            <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" placeholder="https://..." value={formData.seo?.canonicalUrl || ''} onChange={e => setFormData({...formData, seo: {...formData.seo!, canonicalUrl: e.target.value}})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Robots Tag</label>
                            <select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.robots || 'index, follow'} onChange={e => setFormData({...formData, seo: {...formData.seo!, robots: e.target.value}})}>
                                <option value="index, follow">Index, Follow</option>
                                <option value="noindex, follow">NoIndex, Follow</option>
                            </select>
                        </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'gmc' && (
                <section className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center"><Globe size={20} /></div>
                     <div><h4 className="text-lg font-bold dark:text-white">Google Merchant Center</h4></div>
                   </div>

                   <div className="space-y-4">
                     <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 accent-blue-600"
                                checked={formData.gmc?.identifierExists !== false}
                                onChange={e => setFormData({...formData, gmc: {...formData.gmc, identifierExists: e.target.checked}})} 
                            />
                            <div>
                                <span className="font-bold text-sm text-slate-900 dark:text-white">Identifier Exists</span>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Uncheck for custom configuration items without GTIN/MPN.</p>
                            </div>
                        </label>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">GTIN / EAN / UPC</label>
                            <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.gmc?.gtin || ''} onChange={e => setFormData({...formData, gmc: {...formData.gmc, gtin: e.target.value}})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">MPN</label>
                            <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.gmc?.mpn || ''} onChange={e => setFormData({...formData, gmc: {...formData.gmc, mpn: e.target.value}})} />
                        </div>
                     </div>
                   </div>
                </section>
              )}
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

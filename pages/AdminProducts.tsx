
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
  const { settings, refreshGlobalData } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filter, setFilter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'specs' | 'seo' | 'gmc'>('basic');

  const initialFormState: Product = {
    id: '', name: '', slug: '', sku: '', category: 'Servers', price: 0, taxRate: 0.18, brand: '', description: '',
    imageUrl: '', stock: 0, specs: {}, additionalSpecs: {}, condition: 'New', allowDirectBuy: false, isActive: true,
    seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: 'index, follow', ogImage: '' },
    gmc: { gtin: '', mpn: '', googleProductCategory: '', identifierExists: true }
  };
  const [formData, setFormData] = useState<Product>(initialFormState);
  const [specInput, setSpecInput] = useState({ key: '', value: '' });

  const refresh = async () => {
    const p = await getProducts();
    const c = await getCategories();
    const b = await getBrands();
    setProducts(p);
    setCategories(c);
    setBrands(b);
  };

  useEffect(() => { refresh(); }, []);

  // Auto-slugging Logic
  useEffect(() => {
    if (!editingProduct && formData.name) {
      const generatedSlug = formData.name.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, editingProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      ...formData,
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
    };
    await saveProduct(newProduct);
    await refreshGlobalData(); // Force app state update
    setView('list');
    setEditingProduct(null);
    refresh();
  };

  const handleAIGenerate = async () => {
    if (!formData.name || !formData.brand) { alert("Enter product name and brand first."); return; }
    setIsGenerating(true);
    try {
        const description = await generateProductDescription(formData.name, formData.brand, formData.category);
        setFormData(prev => ({ ...prev, description }));
        const seoData = await generateSEOData(formData.name, description);
        if (seoData) {
            setFormData(prev => ({
                ...prev,
                seo: { ...prev.seo!, metaTitle: seoData.metaTitle, metaDescription: seoData.metaDescription, keywords: seoData.keywords }
            }));
        }
    } finally { setIsGenerating(false); }
  };

  const switchToForm = (product?: Product) => {
    setActiveTab('basic');
    if (product) {
      setEditingProduct(product);
      setFormData({ ...initialFormState, ...product });
    } else {
      setEditingProduct(null);
      setFormData({ ...initialFormState, category: categories[0]?.name || 'Servers', brand: brands[0]?.name || 'Dell' });
    }
    setView('form');
  };

  const addSpec = () => {
    if (specInput.key && specInput.value) {
      setFormData({ ...formData, specs: { ...formData.specs, [specInput.key]: specInput.value } });
      setSpecInput({ key: '', value: '' });
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.sku.toLowerCase().includes(filter.toLowerCase()));

  return (
    <AdminLayout>
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold dark:text-white">Products</h2>
            <button onClick={() => switchToForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> Add Product</button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center relative">
              <Search className="absolute left-7 text-slate-400" size={16} />
              <input type="text" placeholder="Search SKU or Name..." className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-950 dark:border-slate-700" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500">
                        <tr><th className="p-4">Info</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {filteredProducts.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={p.imageUrl} className="w-10 h-10 object-contain rounded bg-slate-100" />
                                        <div>
                                            <div className="font-bold dark:text-white">{p.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs dark:text-slate-300">{p.category}</span></td>
                                <td className="p-4 font-bold dark:text-slate-300">{formatCurrency(p.price)}</td>
                                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.isActive ? 'Active' : 'Draft'}</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => switchToForm(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Settings size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800">
          <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="text-slate-400"><ArrowRight className="rotate-180" size={24} /></button>
              <h3 className="text-xl font-bold dark:text-white">{editingProduct ? 'Edit' : 'New'} Product</h3>
            </div>
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Save Product</button>
          </div>
          <div className="flex border-b dark:border-slate-800 px-6 overflow-x-auto no-scrollbar">
            {['basic', 'specs', 'seo', 'gmc'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>{t}</button>
            ))}
          </div>
          <div className="p-8 max-w-4xl">
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Name</label>
                        <input required type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400">URL Slug (Auto-generated)</label>
                        <input type="text" className="w-full p-3 border rounded-lg font-mono text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Price (INR)</label>
                        <input required type="number" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400">Stock</label>
                        <input required type="number" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold uppercase text-slate-400">Description</label>
                            <button type="button" onClick={handleAIGenerate} disabled={isGenerating} className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1">
                                <Sparkles size={10} className={isGenerating ? 'animate-spin' : ''}/> AI Write
                            </button>
                        </div>
                        <RichTextEditor value={formData.description} onChange={v => setFormData({...formData, description: v})} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                        <span className="text-sm font-bold dark:text-white">Active (Visible in Store)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" checked={formData.allowDirectBuy} onChange={e => setFormData({...formData, allowDirectBuy: e.target.checked})} />
                        <span className="text-sm font-bold dark:text-white">Enable Direct Buy</span>
                    </label>
                </div>
              )}
              {activeTab === 'specs' && (
                  <div className="space-y-8 animate-in fade-in">
                      <div><label className="block text-xs font-bold mb-2 uppercase text-slate-400">Product Image</label><ImageUploader currentImage={formData.imageUrl} onImageChange={u => setFormData({...formData, imageUrl: u})} /></div>
                      <div>
                          <label className="block text-xs font-bold mb-4 uppercase text-slate-400">Specs</label>
                          <div className="flex gap-2 mb-4"><input placeholder="Key" className="flex-1 p-2 border rounded dark:bg-slate-950" value={specInput.key} onChange={e => setSpecInput({...specInput, key: e.target.value})}/><input placeholder="Value" className="flex-1 p-2 border rounded dark:bg-slate-950" value={specInput.value} onChange={e => setSpecInput({...specInput, value: e.target.value})}/><button type="button" onClick={addSpec} className="bg-slate-900 text-white px-4 rounded">Add</button></div>
                          <div className="grid grid-cols-2 gap-2">{Object.entries(formData.specs).map(([k,v]) => (<div key={k} className="p-2 border rounded dark:border-slate-800 text-sm flex justify-between dark:text-slate-300"><span><strong>{k}:</strong> {v}</span><button onClick={() => {const s={...formData.specs}; delete s[k]; setFormData({...formData, specs: s})}} className="text-red-500">×</button></div>))}</div>
                      </div>
                  </div>
              )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

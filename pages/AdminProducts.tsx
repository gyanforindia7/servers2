
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getProducts, saveProduct, deleteProduct, getCategories, getBrands, formatCurrency } from '../services/db';
import { generateProductDescription, generateSEOData } from '../services/ai';
import { Product, Category, Brand } from '../types';
// Fix: Removed non-existent 'Layout' import from Icons
import { Plus, Trash2, Settings, Search, Globe, ArrowRight, ShoppingCart, Tag, CheckCircle, Sparkles, ImageIcon } from '../components/Icons';
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
    id: '', name: '', slug: '', sku: '', category: '', brand: '', description: '',
    imageUrl: '', imageUrls: [], price: 0, taxRate: 0.18, stock: 0, 
    specs: {}, additionalSpecs: {}, condition: 'New', allowDirectBuy: false, isActive: true,
    seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: 'index, follow', ogImage: '' },
    gmc: { gtin: '', mpn: '', googleProductCategory: '', identifierExists: true }
  };
  const [formData, setFormData] = useState<Product>(initialFormState);
  const [specInput, setSpecInput] = useState({ key: '', value: '' });
  const [galleryUrl, setGalleryUrl] = useState('');

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
    if (!formData.category) {
        alert("Please select a category.");
        return;
    }
    const newProduct: Product = {
      ...formData,
      id: editingProduct ? editingProduct.id : `p-${Date.now()}`,
    };
    await saveProduct(newProduct);
    await refreshGlobalData();
    setView('list');
    setEditingProduct(null);
    refresh();
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this product?')) {
      await deleteProduct(id);
      await refreshGlobalData();
      refresh();
    }
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
      setFormData({ 
          ...initialFormState, 
          ...product,
          seo: { ...initialFormState.seo, ...(product.seo || {}) },
          gmc: { ...initialFormState.gmc, ...(product.gmc || {}) },
          imageUrls: product.imageUrls || []
      });
    } else {
      setEditingProduct(null);
      setFormData({ 
          ...initialFormState, 
          category: categories[0]?.name || 'Servers', 
          brand: brands[0]?.name || 'Dell' 
      });
    }
    setView('form');
  };

  const addSpec = () => {
    if (specInput.key && specInput.value) {
      setFormData({ ...formData, specs: { ...formData.specs, [specInput.key]: specInput.value } });
      setSpecInput({ key: '', value: '' });
    }
  };

  const addGalleryImage = () => {
    if (galleryUrl) {
      setFormData({ ...formData, imageUrls: [...(formData.imageUrls || []), galleryUrl] });
      setGalleryUrl('');
    }
  };

  const removeGalleryImage = (idx: number) => {
      const newUrls = [...(formData.imageUrls || [])];
      newUrls.splice(idx, 1);
      setFormData({ ...formData, imageUrls: newUrls });
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.sku.toLowerCase().includes(filter.toLowerCase()));

  return (
    <AdminLayout>
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold dark:text-white">Products</h2>
            <button onClick={() => switchToForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"><Plus size={18} /> Add Product</button>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b dark:border-slate-800 flex items-center relative">
              <Search className="absolute left-7 text-slate-400" size={16} />
              <input type="text" placeholder="Search SKU or Name..." className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none" value={filter} onChange={e => setFilter(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-500">
                        <tr><th className="p-4">Info</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {filteredProducts.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={p.imageUrl} className="w-10 h-10 object-contain rounded bg-slate-100" />
                                        <div className="min-w-0">
                                            <div className="font-bold dark:text-white truncate max-w-[200px]">{p.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono uppercase">{p.sku}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs dark:text-slate-300 font-medium">{p.category}</span></td>
                                <td className="p-4 font-bold dark:text-slate-300">{formatCurrency(p.price)}</td>
                                <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{p.isActive ? 'Active' : 'Draft'}</span></td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-1">
                                      <button onClick={() => switchToForm(p)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-all" title="Edit"><Settings size={16}/></button>
                                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition-all" title="Delete"><Trash2 size={16}/></button>
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-xl">
          <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-4">
              <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600"><ArrowRight className="rotate-180" size={24} /></button>
              <h3 className="text-xl font-bold dark:text-white">{editingProduct ? 'Edit' : 'New'} Product</h3>
            </div>
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Save Changes</button>
          </div>
          
          <div className="flex border-b dark:border-slate-800 px-6 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 sticky top-0 z-10">
            {['basic', 'specs', 'seo', 'gmc'].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{t === 'gmc' ? 'Google Shopping' : t}</button>
            ))}
          </div>

          <div className="p-8 max-w-5xl">
              {activeTab === 'basic' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Product Name</label>
                        <input required type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">URL Slug</label>
                        <input type="text" className="w-full p-3 border rounded-lg font-mono text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Category</label>
                        <select required className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Brand</label>
                        <select required className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white bg-white" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                             <option value="">Select Brand</option>
                             {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Price (INR)</label>
                        <input required type="number" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">SKU</label>
                        <input required type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white uppercase font-mono" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold uppercase text-slate-400 tracking-widest">Description</label>
                            <button type="button" onClick={handleAIGenerate} disabled={isGenerating} className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full flex items-center gap-1 hover:bg-blue-700 transition-colors disabled:bg-slate-400">
                                <Sparkles size={10} className={isGenerating ? 'animate-spin' : ''}/> AI Professional Write
                            </button>
                        </div>
                        <RichTextEditor value={formData.description} onChange={v => setFormData({...formData, description: v})} />
                    </div>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-5 h-5 rounded accent-blue-600" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                            <span className="text-sm font-bold dark:text-white group-hover:text-blue-600 transition-colors">Visible in Store</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-5 h-5 rounded accent-blue-600" checked={formData.allowDirectBuy} onChange={e => setFormData({...formData, allowDirectBuy: e.target.checked})} />
                            <span className="text-sm font-bold dark:text-white group-hover:text-blue-600 transition-colors">Enable Add to Cart</span>
                        </label>
                    </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-8 animate-in fade-in">
                    <div>
                        <label className="block text-xs font-bold mb-2 uppercase text-slate-400 tracking-widest">Main Featured Image</label>
                        <ImageUploader currentImage={formData.imageUrl} onImageChange={u => setFormData({...formData, imageUrl: u})} />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold mb-4 uppercase text-slate-400 tracking-widest">Photo Gallery (Multi-Image)</label>
                        <div className="flex gap-2 mb-4">
                            <input placeholder="Paste Image URL" className="flex-1 p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={galleryUrl} onChange={e => setGalleryUrl(e.target.value)}/>
                            <button type="button" onClick={addGalleryImage} className="bg-slate-900 text-white px-6 rounded-lg font-bold flex items-center gap-2"><Plus size={18}/> Add</button>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
                            {(formData.imageUrls || []).map((url, idx) => (
                                <div key={idx} className="relative aspect-square rounded-xl border dark:border-slate-800 overflow-hidden group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button onClick={() => removeGalleryImage(idx)} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold mb-4 uppercase text-slate-400 tracking-widest">Technical Specifications</label>
                        <div className="flex gap-2 mb-4">
                            <input placeholder="Key (e.g. CPU)" className="flex-1 p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={specInput.key} onChange={e => setSpecInput({...specInput, key: e.target.value})}/>
                            <input placeholder="Value (e.g. Xeon Gold)" className="flex-1 p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={specInput.value} onChange={e => setSpecInput({...specInput, value: e.target.value})}/>
                            <button type="button" onClick={addSpec} className="bg-slate-900 text-white px-6 rounded-lg font-bold">Add Spec</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(formData.specs).map(([k,v]) => (
                                <div key={k} className="p-3 border rounded-lg dark:border-slate-800 text-sm flex justify-between items-center dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30">
                                    <span><strong className="text-slate-400 uppercase text-[10px] mr-2">{k}:</strong> {v}</span>
                                    <button onClick={() => {const s={...formData.specs}; delete s[k]; setFormData({...formData, specs: s})}} className="text-red-500 hover:bg-red-50 p-1 rounded">×</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              )}

              {activeTab === 'seo' && (
                  <div className="space-y-6 animate-in fade-in bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold flex items-center gap-2 mb-4"><Globe size={18}/> Search Engine Optimization</h4>
                      <div>
                          <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Meta Title</label>
                          <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.metaTitle} onChange={e => setFormData({...formData, seo: {...formData.seo!, metaTitle: e.target.value}})} />
                          <p className="text-[10px] text-slate-400 mt-1">Recommended: 50-60 characters</p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Meta Description</label>
                          <textarea className="w-full p-3 border rounded-lg h-24 dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.metaDescription} onChange={e => setFormData({...formData, seo: {...formData.seo!, metaDescription: e.target.value}})} />
                          <p className="text-[10px] text-slate-400 mt-1">Recommended: 150-160 characters</p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Keywords (Comma separated)</label>
                          <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.keywords} onChange={e => setFormData({...formData, seo: {...formData.seo!, keywords: e.target.value}})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Canonical URL</label><input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.canonicalUrl || ''} onChange={e => setFormData({...formData, seo: {...formData.seo!, canonicalUrl: e.target.value}})} /></div>
                        <div><label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Robots</label><select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.robots || 'index, follow'} onChange={e => setFormData({...formData, seo: {...formData.seo!, robots: e.target.value}})}><option>index, follow</option><option>noindex, nofollow</option></select></div>
                      </div>
                  </div>
              )}

              {activeTab === 'gmc' && (
                  <div className="space-y-6 animate-in fade-in bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-4">
                          <ShoppingCart size={18} className="text-blue-600"/>
                          <h4 className="font-bold">Google Shopping Feed (GMC)</h4>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">Fill these fields to display your products on Google Shopping search results.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">GTIN / EAN</label>
                            <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.gmc?.gtin} onChange={e => setFormData({...formData, gmc: {...formData.gmc!, gtin: e.target.value}})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">MPN (Manufacturer Part Number)</label>
                            {/* Fix: Property name should be 'mpn', not 'gsync' */}
                            <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.gmc?.mpn} onChange={e => setFormData({...formData, gmc: {...formData.gmc!, mpn: e.target.value}})} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold mb-1 uppercase text-slate-400 tracking-widest">Google Product Category ID</label>
                            <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.gmc?.googleProductCategory} onChange={e => setFormData({...formData, gmc: {...formData.gmc!, googleProductCategory: e.target.value}})} />
                        </div>
                      </div>
                  </div>
              )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

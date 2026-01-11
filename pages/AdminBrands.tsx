
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getBrands, saveBrand, deleteBrand } from '../services/db';
import { Plus, Trash2, Briefcase, ArrowRight, Settings, Search } from '../components/Icons';
import { Brand } from '../types';
import { ImageUploader } from '../components/ImageUploader';
import { useApp } from '../App';

export const AdminBrands: React.FC = () => {
  const { refreshGlobalData } = useApp();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm: Brand = {
    id: '', name: '', slug: '', description: '', imageUrl: '', seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: 'index, follow' }
  };
  const [formData, setFormData] = useState<Brand>(initialForm);

  const refresh = async () => {
      const b = await getBrands();
      setBrands(b);
  };
  useEffect(() => { refresh(); }, []);

  // Auto-slugging Logic
  useEffect(() => {
    if (!editingId && formData.name) {
      const generatedSlug = formData.name.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, editingId]);

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setFormData({ ...brand, description: brand.description || '', imageUrl: brand.imageUrl || '', slug: brand.slug || '', seo: { ...initialForm.seo, ...brand.seo } });
    setView('form');
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ ...initialForm, id: `brand-${Date.now()}` });
    setView('form');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBrand(formData);
    await refreshGlobalData();
    setView('list'); refresh();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete this brand?`)) { 
        await deleteBrand(id); 
        await refreshGlobalData();
        refresh(); 
    }
  };

  return (
    <AdminLayout>
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold dark:text-white">Brand Management</h2><button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"><Plus size={20} /> Add Brand</button></div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"><tr><th className="p-4 w-24">Logo</th><th className="p-4">Brand Name</th><th className="p-4">SEO Title</th><th className="p-4 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{brands.map(b => (<tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800"><td className="p-4">{b.imageUrl ? <img src={b.imageUrl} alt={b.name} className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400"><Briefcase size={16} /></div>}</td><td className="p-4 font-medium dark:text-white">{b.name}</td><td className="p-4 text-sm text-slate-500 dark:text-slate-400">{b.seo?.metaTitle || '-'}</td><td className="p-4 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => handleEdit(b)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded"><Settings size={16} /></button><button type="button" onClick={(e) => handleDelete(b.id, e)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded"><Trash2 size={16} /></button></div></td></tr>))}</tbody></table></div></div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setView('list')} className="text-slate-500 hover:text-slate-800"><ArrowRight className="rotate-180" size={24} /></button><h3 className="text-xl font-bold dark:text-white">{editingId ? 'Edit Brand' : 'Add New Brand'}</h3></div><div className="flex gap-2"><button type="button" onClick={() => setView('list')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Save Brand</button></div></div>
          <div className="p-8 max-w-3xl mx-auto">
            <form onSubmit={handleSave} className="space-y-8">
              <section className="space-y-6">
                <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Brand Name</label><input type="text" required className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">URL Slug (Auto-generated)</label><input type="text" className="w-full p-3 border rounded-lg font-mono text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Brand Logo</label><ImageUploader currentImage={formData.imageUrl || ''} onImageChange={(url) => setFormData({...formData, imageUrl: url})} /></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Description</label><textarea className="w-full p-3 border rounded-lg h-32 dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
              </section>
              <section className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white"><Search size={20} /> Advanced SEO</h4>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Meta Title</label><input type="text" className="w-full p-2 border rounded dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.metaTitle} onChange={e => setFormData({...formData, seo: {...formData.seo!, metaTitle: e.target.value}})} /></div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Meta Description</label><textarea className="w-full p-2 border rounded h-20 dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.metaDescription} onChange={e => setFormData({...formData, seo: {...formData.seo!, metaDescription: e.target.value}})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Canonical URL</label><input type="text" className="w-full p-2 border rounded dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.canonicalUrl || ''} onChange={e => setFormData({...formData, seo: {...formData.seo!, canonicalUrl: e.target.value}})} /></div>
                        <div><label className="block text-sm font-medium mb-1 dark:text-slate-300">Robots</label><select className="w-full p-2 border rounded bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.seo?.robots || 'index, follow'} onChange={e => setFormData({...formData, seo: {...formData.seo!, robots: e.target.value}})}><option>index, follow</option><option>noindex, nofollow</option></select></div>
                    </div>
                  </div>
              </section>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

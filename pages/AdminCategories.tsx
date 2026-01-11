
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getCategories, saveCategory, deleteCategory } from '../services/db';
import { Plus, Trash2, Tag, ArrowRight, Settings, Search, Home, ChevronRight as CornerDownRight, Menu } from '../components/Icons';
import { Category } from '../types';
import { ImageUploader } from '../components/ImageUploader';
import { useApp } from '../App';

export const AdminCategories: React.FC = () => {
  const { refreshGlobalData } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialForm: Category = {
    id: '', name: '', slug: '', description: '', imageUrl: '', showOnHome: true, showInMenu: true, parentId: '', 
    seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: 'index, follow' }
  };
  const [formData, setFormData] = useState<Category>(initialForm);

  const refresh = async () => {
      const cats = await getCategories();
      setCategories(cats);
  };
  useEffect(() => { refresh(); }, []);

  // Auto-slugging logic
  useEffect(() => {
    if (!editingId && formData.name) {
      const generatedSlug = formData.name.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, editingId]);

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({ ...cat, imageUrl: cat.imageUrl || '', showOnHome: cat.showOnHome !== false, showInMenu: cat.showInMenu !== false, parentId: cat.parentId || '', seo: { ...initialForm.seo, ...cat.seo } });
    setView('form');
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ ...initialForm, id: `cat-${Date.now()}` });
    setView('form');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData, parentId: formData.parentId === '' ? undefined : formData.parentId };
    await saveCategory(finalData);
    await refreshGlobalData();
    setView('list'); refresh();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete this category?`)) { 
        await deleteCategory(id); 
        await refreshGlobalData();
        refresh(); 
    }
  };

  const toggleShowInMenu = async (cat: Category) => {
      await saveCategory({ ...cat, showInMenu: !cat.showInMenu });
      await refreshGlobalData();
      refresh();
  };

  const renderCategoryRow = (cat: Category, level: number = 0) => (
    <React.Fragment key={cat.id}>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800">
        <td className="p-4">{cat.imageUrl ? <img src={cat.imageUrl} alt="" className="w-10 h-10 rounded object-cover bg-slate-100" /> : <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Tag size={16} /></div>}</td>
        <td className="p-4 font-medium"><div className="flex items-center gap-2 dark:text-white" style={{ paddingLeft: `${level * 24}px` }}>{level > 0 && <CornerDownRight size={16} className="text-slate-400" />}{cat.name}</div></td>
        <td className="p-4">
            <div className="flex gap-4 items-center">
                {cat.showOnHome !== false && <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit"><Home size={10} /> Home</span>}
                
                <label className="relative inline-flex items-center cursor-pointer" title="Toggle Header Menu Visibility">
                    <input type="checkbox" className="sr-only peer" checked={cat.showInMenu !== false} onChange={(e) => { e.stopPropagation(); toggleShowInMenu(cat); }} />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">Menu</span>
                </label>
            </div>
        </td>
        <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{cat.seo?.metaTitle || '-'}</td>
        <td className="p-4 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => handleEdit(cat)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded"><Settings size={16} /></button><button type="button" onClick={(e) => handleDelete(cat.id, e)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded"><Trash2 size={16} /></button></div></td>
      </tr>
      {categories.filter(c => c.parentId === cat.id).map(child => renderCategoryRow(child, level + 1))}
    </React.Fragment>
  );

  return (
    <AdminLayout>
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold dark:text-white">Category Management</h2><button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"><Plus size={20} /> Add Category</button></div>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[800px]"><thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"><tr><th className="p-4 w-20">Image</th><th className="p-4">Name</th><th className="p-4">Visibility</th><th className="p-4">SEO Title</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{categories.filter(c => !c.parentId).map(c => renderCategoryRow(c))}{categories.filter(c => c.parentId && !categories.find(p => p.id === c.parentId)).map(c => renderCategoryRow(c))}</tbody></table></div></div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setView('list')} className="text-slate-500 hover:text-slate-800"><ArrowRight className="rotate-180" size={24} /></button><h3 className="text-xl font-bold dark:text-white">{editingId ? 'Edit Category' : 'Add New Category'}</h3></div><div className="flex gap-2"><button type="button" onClick={() => setView('list')} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Save Category</button></div></div>
          <div className="p-8 max-w-4xl mx-auto">
            <form onSubmit={handleSave} className="space-y-8">
              <section>
                 <h4 className="text-lg font-bold mb-4 border-b dark:border-slate-800 pb-2 dark:text-white">General Information</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-1 dark:text-slate-300">Category Name</label><input type="text" required className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-1 dark:text-slate-300">URL Slug (Auto-generated)</label><input type="text" className="w-full p-3 border rounded-lg font-mono text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-1 dark:text-slate-300">Parent Category</label><select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})}><option value="">None (Top Level)</option>{categories.filter(c => c.id !== formData.id).map(c => (<option key={c.id} value={c.id}>{c.name} {c.parentId ? '(Subcategory)' : ''}</option>))}</select></div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"><label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><input type="checkbox" className="w-5 h-5 accent-blue-600" checked={formData.showOnHome !== false} onChange={e => setFormData({...formData, showOnHome: e.target.checked})} /><div><span className="font-bold text-slate-900 dark:text-white block flex items-center gap-2"><Home size={16}/> Show on Home Page</span></div></label><label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><input type="checkbox" className="w-5 h-5 accent-blue-600" checked={formData.showInMenu !== false} onChange={e => setFormData({...formData, showInMenu: e.target.checked})} /><div><span className="font-bold text-slate-900 dark:text-white block flex items-center gap-2"><Menu size={16}/> Show in Header Menu</span></div></label></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-1 dark:text-slate-300">Category Image</label><ImageUploader currentImage={formData.imageUrl || ''} onImageChange={(url) => setFormData({...formData, imageUrl: url})} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-1 dark:text-slate-300">Description</label><textarea className="w-full p-3 border rounded-lg h-32 dark:bg-slate-950 dark:border-slate-700 dark:text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                 </div>
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

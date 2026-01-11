
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getPages, savePage, deletePage, getSiteSettings, getCategories, saveCategory } from '../services/db';
import { PageContent, SiteSettings, Category } from '../types';
import { Edit, Trash2, Plus, Save, Settings, FileText, ArrowRight, Search, Globe, Mail, Phone, MapPin, List } from '../components/Icons';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImageUploader } from '../components/ImageUploader';
import { useApp } from '../App';

export const AdminCMS: React.FC = () => {
  const { updateSettings, settings: globalSettings, refreshGlobalData } = useApp();
  const [activeTab, setActiveTab] = useState<'settings' | 'contact' | 'pages'>('settings');
  const [settings, setSettings] = useState<SiteSettings>(globalSettings);
  
  // Pages state
  const [pages, setPages] = useState<PageContent[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  
  const initialPage: PageContent = {
    id: '', slug: '', title: '', content: '', showInMenu: false, showInFooter: true, sortOrder: 0,
    seo: { metaTitle: '', metaDescription: '', keywords: '' }
  };
  const [pageFormData, setPageFormData] = useState<PageContent>(initialPage);

  const refresh = async () => {
    const p = await getPages();
    setPages(p);
  };

  useEffect(() => {
    refresh();
    setSettings(globalSettings);
  }, [globalSettings]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(settings);
    await refreshGlobalData();
    alert('Settings applied successfully!');
  };

  const handlePageSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPage = {
        ...pageFormData,
        id: editingPage ? editingPage.id : `pg-${Date.now()}`,
        slug: pageFormData.slug || pageFormData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    };
    await savePage(finalPage);
    await refreshGlobalData();
    setView('list');
    refresh();
  };

  const handleEditPage = (page: PageContent) => {
    setEditingPage(page);
    setPageFormData(page);
    setView('form');
  };

  const handleCreatePage = () => {
    setEditingPage(null);
    setPageFormData(initialPage);
    setView('form');
  };

  const handleDeletePage = async (id: string) => {
    if (window.confirm('Delete this page?')) {
        await deletePage(id);
        await refreshGlobalData();
        refresh();
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-8 dark:text-white">CMS & Store Settings</h2>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden min-h-[600px]">
        <div className="flex border-b dark:border-slate-800 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-slate-800/20">
          <button onClick={() => setActiveTab('settings')} className={`px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'settings' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>General Visuals</button>
          <button onClick={() => setActiveTab('contact')} className={`px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'contact' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Header & Footer</button>
          <button onClick={() => setActiveTab('pages')} className={`px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'pages' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Custom Pages</button>
        </div>

        <div className="p-8">
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="max-w-3xl space-y-8 animate-in fade-in">
              <div className="space-y-6">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Browser Favicon (.ico / .png)</label><ImageUploader currentImage={settings.faviconUrl || ''} onImageChange={u => setSettings({...settings, faviconUrl: u})} /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Site Logo</label><ImageUploader currentImage={settings.logoUrl || ''} onImageChange={u => setSettings({...settings, logoUrl: u})} /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Home Hero Banner</label><ImageUploader currentImage={settings.bannerUrl || ''} onImageChange={u => setSettings({...settings, bannerUrl: u})} /></div>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"><Save size={18} /> Apply Branding</button>
            </form>
          )}

          {activeTab === 'contact' && (
            <form onSubmit={handleSettingsSave} className="max-w-3xl space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Support Phone</label>
                  <div className="relative"><Phone className="absolute left-3 top-3 text-slate-400" size={16}/><input type="text" className="w-full pl-10 p-3 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700" value={settings.supportPhone} onChange={e => setSettings({...settings, supportPhone: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Support Email</label>
                  <div className="relative"><Mail className="absolute left-3 top-3 text-slate-400" size={16}/><input type="email" className="w-full pl-10 p-3 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700" value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} /></div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Office Address</label>
                  <div className="relative"><MapPin className="absolute left-3 top-3 text-slate-400" size={16}/><textarea className="w-full pl-10 p-3 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700 h-24" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">WhatsApp Number (with country code)</label>
                  <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700" value={settings.whatsappNumber} onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} placeholder="+919876543210" />
                </div>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"><Save size={18} /> Update Contact Info</button>
            </form>
          )}

          {activeTab === 'pages' && (
            <div className="animate-in fade-in">
              {view === 'list' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold dark:text-white">Site Content Pages</h3>
                    <button onClick={handleCreatePage} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Plus size={16} /> Add Page</button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {pages.map(page => (
                      <div key={page.id} className="p-4 border rounded-xl dark:border-slate-800 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div>
                          <div className="font-bold dark:text-white">{page.title}</div>
                          <div className="text-[10px] font-mono text-slate-400">/page/{page.slug}</div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleEditPage(page)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                           <button onClick={() => handleDeletePage(page.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                    {pages.length === 0 && <div className="text-center py-12 text-slate-400">No custom pages created yet.</div>}
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePageSave} className="space-y-6 max-w-4xl">
                   <div className="flex items-center gap-4 mb-4">
                      <button type="button" onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600"><ArrowRight className="rotate-180" size={20} /></button>
                      <h3 className="font-bold dark:text-white">{editingPage ? 'Edit Page' : 'New Page'}</h3>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Page Title</label>
                        <input required className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700" value={pageFormData.title} onChange={e => setPageFormData({...pageFormData, title: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Slug</label>
                        <input className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700 font-mono text-sm" value={pageFormData.slug} onChange={e => setPageFormData({...pageFormData, slug: e.target.value})} placeholder="about-us" />
                      </div>
                      <div className="flex items-center gap-4 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={pageFormData.showInMenu} onChange={e => setPageFormData({...pageFormData, showInMenu: e.target.checked})} />
                            <span className="text-xs font-bold">Show in Header</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={pageFormData.showInFooter} onChange={e => setPageFormData({...pageFormData, showInFooter: e.target.checked})} />
                            <span className="text-xs font-bold">Show in Footer</span>
                        </label>
                      </div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Page Content (HTML Supported)</label>
                      <RichTextEditor value={pageFormData.content} onChange={v => setPageFormData({...pageFormData, content: v})} className="min-h-[300px]" />
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-sm mb-4 flex items-center gap-2"><Globe size={16}/> Page SEO Settings</h4>
                      <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Meta Title</label>
                            <input className="w-full p-2 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700" value={pageFormData.seo?.metaTitle} onChange={e => setPageFormData({...pageFormData, seo: {...pageFormData.seo!, metaTitle: e.target.value}})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Meta Description</label>
                            <textarea className="w-full p-2 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700 h-16" value={pageFormData.seo?.metaDescription} onChange={e => setPageFormData({...pageFormData, seo: {...pageFormData.seo!, metaDescription: e.target.value}})} />
                        </div>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700"><Save size={18}/> Save Page</button>
                      <button type="button" onClick={() => setView('list')} className="text-slate-500 px-8 py-3 hover:bg-slate-100 rounded-xl">Cancel</button>
                   </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { AdminLayout, useAdmin } from '../components/AdminLayout';
import { getPages, savePage, deletePage, getSiteSettings } from '../services/db';
import { PageContent, SiteSettings } from '../types';
import { Edit, Trash2, Plus, Save, Globe, ArrowRight, Mail, Phone, MapPin } from '../components/Icons';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImageUploader } from '../components/ImageUploader';
import { useApp } from '../App';

export const AdminCMS: React.FC = () => {
  const { updateSettings, settings: globalSettings, refreshGlobalData } = useApp();
  const { notify } = useAdmin();
  const [activeTab, setActiveTab] = useState<'settings' | 'contact' | 'pages'>('settings');
  const [settings, setSettings] = useState<SiteSettings>(globalSettings);
  const [isSaving, setIsSaving] = useState(false);
  
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
    setIsSaving(true);
    try {
        await updateSettings(settings);
        await refreshGlobalData();
        notify('Site settings updated successfully!');
    } catch (err: any) {
        notify(err.message || 'Failed to update settings.', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const handlePageSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const finalPage = {
            ...pageFormData,
            id: editingPage ? editingPage.id : `pg-${Date.now()}`,
            slug: pageFormData.slug || pageFormData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        };
        await savePage(finalPage);
        await refreshGlobalData();
        notify('CMS page saved!');
        setView('list');
        refresh();
    } catch (err: any) {
        notify(err.message || 'Failed to save page.', 'error');
    } finally {
        setIsSaving(false);
    }
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
        try {
            await deletePage(id);
            notify('Page deleted.');
            await refreshGlobalData();
            refresh();
        } catch (err: any) {
            notify('Delete failed.', 'error');
        }
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-8 dark:text-white">Site Management (CMS)</h2>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden min-h-[600px]">
        <div className="flex border-b dark:border-slate-800 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-slate-800/20">
          <button onClick={() => setActiveTab('settings')} className={`px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'settings' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Branding</button>
          <button onClick={() => setActiveTab('contact')} className={`px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'contact' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Contact & Help</button>
          <button onClick={() => setActiveTab('pages')} className={`px-8 py-4 font-bold text-xs uppercase tracking-widest border-b-2 transition-all ${activeTab === 'pages' ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-800'}`}>Custom Pages</button>
        </div>

        <div className="p-8">
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="max-w-3xl space-y-8 animate-in fade-in">
              <div className="space-y-6">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Favicon URL</label><ImageUploader currentImage={settings.faviconUrl || ''} onImageChange={u => setSettings({...settings, faviconUrl: u})} /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Site Logo</label><ImageUploader currentImage={settings.logoUrl || ''} onImageChange={u => setSettings({...settings, logoUrl: u})} /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-widest">Hero Banner</label><ImageUploader currentImage={settings.bannerUrl || ''} onImageChange={u => setSettings({...settings, bannerUrl: u})} /></div>
              </div>
              <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                <Save size={18} /> {isSaving ? 'Applying...' : 'Save Branding'}
              </button>
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
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Address</label>
                  <div className="relative"><MapPin className="absolute left-3 top-3 text-slate-400" size={16}/><textarea className="w-full pl-10 p-3 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700 h-24" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} /></div>
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50">
                <Save size={18} /> {isSaving ? 'Saving...' : 'Update Details'}
              </button>
            </form>
          )}

          {activeTab === 'pages' && (
            <div className="animate-in fade-in">
              {view === 'list' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold dark:text-white">Content Pages</h3>
                    <button onClick={handleCreatePage} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"><Plus size={16} /> New Page</button>
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
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePageSave} className="space-y-6 max-w-4xl">
                   <div className="flex items-center gap-4 mb-4">
                      <button type="button" onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600"><ArrowRight className="rotate-180" size={20} /></button>
                      <h3 className="font-bold dark:text-white">{editingPage ? 'Edit' : 'New'} Page</h3>
                   </div>
                   <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Title</label>
                      <input required className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:text-white dark:border-slate-700" value={pageFormData.title} onChange={e => setPageFormData({...pageFormData, title: e.target.value})} />
                   </div>
                   <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1 tracking-widest">Content</label>
                      <RichTextEditor value={pageFormData.content} onChange={v => setPageFormData({...pageFormData, content: v})} className="min-h-[300px]" />
                   </div>
                   <div className="flex gap-4">
                      <button type="submit" disabled={isSaving} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                        <Save size={18}/> {isSaving ? 'Saving...' : 'Save Page'}
                      </button>
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

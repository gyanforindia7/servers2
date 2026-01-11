
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getPages, savePage, deletePage, getSiteSettings, getCategories, saveCategory } from '../services/db';
import { PageContent, SiteSettings, Category } from '../types';
import { Edit, Trash2, Plus, Save, Settings, FileText, ArrowRight, Search, MessageCircle, ImageIcon, Globe, CreditCard, Menu, CheckCircle, List, Tag, LayoutDashboard, Truck, Smartphone, Rocket, ShieldCheck, Lock, ExternalLink, Terminal, Check, Mail, Phone, MapPin } from '../components/Icons';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImageUploader } from '../components/ImageUploader';
import { useApp } from '../App';

export const AdminCMS: React.FC = () => {
  const { updateSettings, settings: globalSettings, refreshGlobalData } = useApp();
  const [activeTab, setActiveTab] = useState<'settings' | 'contact' | 'pages' | 'menu' | 'production'>('settings');
  const [settings, setSettings] = useState<SiteSettings>(globalSettings);
  const [pages, setPages] = useState<PageContent[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const p = await getPages();
      setPages(p);
    };
    loadData();
    setSettings(globalSettings);
  }, [globalSettings]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(settings);
    await refreshGlobalData();
    alert('Settings applied successfully!');
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-8 dark:text-white">CMS & Store Settings</h2>
      <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 overflow-hidden min-h-[600px]">
        <div className="flex border-b dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('settings')} className={`px-6 py-4 font-bold text-xs uppercase tracking-widest ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Visuals</button>
          <button onClick={() => setActiveTab('contact')} className={`px-6 py-4 font-bold text-xs uppercase tracking-widest ${activeTab === 'contact' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Contact & Info</button>
          <button onClick={() => setActiveTab('pages')} className={`px-6 py-4 font-bold text-xs uppercase tracking-widest ${activeTab === 'pages' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Pages</button>
        </div>

        <div className="p-8">
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="max-w-3xl space-y-8 animate-in fade-in">
              <div className="space-y-6">
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2">Favicon (Tab Icon)</label><ImageUploader currentImage={settings.faviconUrl || ''} onImageChange={u => setSettings({...settings, faviconUrl: u})} /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2">Logo</label><ImageUploader currentImage={settings.logoUrl || ''} onImageChange={u => setSettings({...settings, logoUrl: u})} /></div>
                <div><label className="block text-xs font-bold uppercase text-slate-400 mb-2">Hero Banner</label><ImageUploader currentImage={settings.bannerUrl || ''} onImageChange={u => setSettings({...settings, bannerUrl: u})} /></div>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2"><Save size={18} /> Apply Changes</button>
            </form>
          )}

          {activeTab === 'contact' && (
            <form onSubmit={handleSettingsSave} className="max-w-3xl space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Support Phone</label>
                  <div className="relative"><Phone className="absolute left-3 top-3 text-slate-400" size={16}/><input type="text" className="w-full pl-10 p-3 border rounded-lg dark:bg-slate-950 dark:text-white" value={settings.supportPhone} onChange={e => setSettings({...settings, supportPhone: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Support Email</label>
                  <div className="relative"><Mail className="absolute left-3 top-3 text-slate-400" size={16}/><input type="email" className="w-full pl-10 p-3 border rounded-lg dark:bg-slate-950 dark:text-white" value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} /></div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Office Address</label>
                  <div className="relative"><MapPin className="absolute left-3 top-3 text-slate-400" size={16}/><textarea className="w-full pl-10 p-3 border rounded-lg dark:bg-slate-950 dark:text-white h-24" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">WhatsApp Number</label>
                  <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:text-white" value={settings.whatsappNumber} onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2"><Save size={18} /> Save Contact Details</button>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

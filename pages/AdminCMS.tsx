import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getPages, savePage, deletePage, getSiteSettings, getCategories, saveCategory } from '../services/db';
import { PageContent, SiteSettings, Category } from '../types';
import { Edit, Trash2, Plus, Save, Settings, FileText, ArrowRight, Search, MessageCircle, ImageIcon, Globe, CreditCard, Menu, CheckCircle, List, Tag, LayoutDashboard, Truck, Smartphone, Rocket, ShieldCheck, Lock, ExternalLink } from '../components/Icons';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImageUploader } from '../components/ImageUploader';
import { useApp } from '../App';

export const AdminCMS: React.FC = () => {
  const { updateSettings, settings: globalSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'settings' | 'pages' | 'menu' | 'footer' | 'production'>('settings');
  const [settings, setSettings] = useState<SiteSettings>(globalSettings);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTaxRate, setNewTaxRate] = useState<string>('');
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  
  const initialPageForm: PageContent = {
    id: '',
    slug: '',
    title: '',
    content: '',
    showInMenu: false,
    showInFooter: true,
    sortOrder: 0,
    seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: 'index, follow' }
  };
  const [pageFormData, setPageFormData] = useState<PageContent>(initialPageForm);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, c] = await Promise.all([getPages(), getCategories()]);
        setPages(p);
        setCategories(c);
      } catch (err) {
        console.error("CMS Load Error:", err);
      }
    };
    loadData();
    setSettings(globalSettings);
  }, [globalSettings]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(settings);
    alert('Settings saved successfully!');
  };

  const handleAddTaxRate = () => {
      const rate = parseFloat(newTaxRate);
      if (!isNaN(rate)) {
          const currentRates = settings.taxRates || [];
          if (!currentRates.includes(rate)) {
              const updated = [...currentRates, rate].sort((a,b) => a - b);
              setSettings({ ...settings, taxRates: updated });
              setNewTaxRate('');
          }
      }
  };

  const handleRemoveTaxRate = (rate: number) => {
      const updated = (settings.taxRates || []).filter(r => r !== rate);
      setSettings({ ...settings, taxRates: updated });
  };

  const handlePageEdit = (page: PageContent) => {
    setEditingPageId(page.id);
    setPageFormData({
        ...page,
        showInMenu: page.showInMenu || false,
        showInFooter: page.showInFooter !== false,
        seo: { ...initialPageForm.seo, ...page.seo }
    });
    setView('form');
  };

  const handlePageCreate = () => {
    setEditingPageId(null);
    setPageFormData({ ...initialPageForm, id: `page-${Date.now()}` });
    setView('form');
  };

  const handlePageSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = pageFormData.slug || pageFormData.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    const finalData = { ...pageFormData, slug };
    await savePage(finalData);
    const p = await getPages();
    setPages(p);
    setView('list');
  };

  const handlePageDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this page?')) {
      await deletePage(id);
      const p = await getPages();
      setPages(p);
    }
  };
  
  const toggleCategoryMenu = async (cat: Category) => {
      await saveCategory({ ...cat, showInMenu: !cat.showInMenu });
      const c = await getCategories();
      setCategories(c);
  };

  const updateCategoryOrder = async (cat: Category, order: number) => {
      await saveCategory({ ...cat, sortOrder: order });
      const c = await getCategories();
      setCategories(c);
  };
  
  const togglePageMenu = async (p: PageContent) => {
      await savePage({ ...p, showInMenu: !p.showInMenu });
      const pages = await getPages();
      setPages(pages);
  };

  const updatePageOrder = async (p: PageContent, order: number) => {
      await savePage({ ...p, sortOrder: order });
      const pages = await getPages();
      setPages(pages);
  };

  const toggleCategoryFooter = async (cat: Category) => {
      await saveCategory({ ...cat, showInFooter: !cat.showInFooter });
      const c = await getCategories();
      setCategories(c);
  };

  const togglePageFooter = async (p: PageContent) => {
      await savePage({ ...p, showInFooter: !p.showInFooter });
      const pages = await getPages();
      setPages(pages);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Content & Settings</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[600px]">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button onClick={() => { setActiveTab('settings'); setView('list'); }} className={`px-6 py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'settings' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><Settings size={18} /> General Settings</button>
          <button onClick={() => setActiveTab('pages')} className={`px-6 py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'pages' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><FileText size={18} /> Pages</button>
          <button onClick={() => setActiveTab('menu')} className={`px-6 py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'menu' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><List size={18} /> Header Menu</button>
          <button onClick={() => setActiveTab('footer')} className={`px-6 py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'footer' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}><LayoutDashboard size={18} /> Footer Menu</button>
          <button onClick={() => setActiveTab('production')} className={`px-6 py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'production' ? 'bg-slate-50 dark:bg-slate-800 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800 font-bold'}`}><Rocket size={18} /> Go Live Guide</button>
        </div>

        <div className="p-8">
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="max-w-3xl space-y-8 animate-in fade-in">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                      <div className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 p-2.5 rounded-lg shadow-sm"><ImageIcon size={24} /></div>
                      <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Website Logo</h3></div>
                  </div>
                  <ImageUploader currentImage={settings.logoUrl || ''} onImageChange={(url) => setSettings({...settings, logoUrl: url})} />
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 p-2.5 rounded-lg shadow-sm"><ImageIcon size={24} /></div>
                      <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Home Page Banner</h3></div>
                  </div>
                  <ImageUploader currentImage={settings.bannerUrl || ''} onImageChange={(url) => setSettings({...settings, bannerUrl: url})} />
                </div>
              </div>

              {/* Payment Settings */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
                 <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-lg shadow-sm"><CreditCard size={24} /></div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Gateway Configuration</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Configure enabled payment methods for checkout</p>
                    </div>
                 </div>
                 
                 <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><Truck size={20} className="text-slate-500 dark:text-slate-400"/> Cash on Delivery (COD)</div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enableCOD !== false} onChange={e => setSettings({...settings, enableCOD: e.target.checked})} />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Allow customers to pay when the product is delivered.</p>
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><CreditCard size={20} className="text-blue-600 dark:text-blue-400"/> Razorpay</div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enableRazorpay || false} onChange={e => setSettings({...settings, enableRazorpay: e.target.checked})} />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {settings.enableRazorpay && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Key ID</label>
                                <input type="text" className="w-full p-2 border rounded bg-white dark:bg-slate-900 dark:border-slate-700 text-sm" value={settings.razorpayKeyId || ''} onChange={e => setSettings({...settings, razorpayKeyId: e.target.value})} placeholder="rzp_test_..." />
                            </div>
                             <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Key Secret</label>
                                <input type="password" className="w-full p-2 border rounded bg-white dark:bg-slate-900 dark:border-slate-700 text-sm" value={settings.razorpayKeySecret || ''} onChange={e => setSettings({...settings, razorpayKeySecret: e.target.value})} placeholder="Secret Key" />
                            </div>
                        </div>
                    )}
                 </div>

                 <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><CreditCard size={20} className="text-purple-600 dark:text-purple-400"/> PhonePe</div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={settings.enablePhonePe || false} onChange={e => setSettings({...settings, enablePhonePe: e.target.checked})} />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    {settings.enablePhonePe && (
                        <div className="grid grid-cols-1 gap-4 animate-in fade-in">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Merchant ID</label>
                                <input type="text" className="w-full p-2 border rounded bg-white dark:bg-slate-900 dark:border-slate-700 text-sm" value={settings.phonePeMerchantId || ''} onChange={e => setSettings({...settings, phonePeMerchantId: e.target.value})} placeholder="MERCHANTUAT" />
                            </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Salt Key</label>
                                    <input type="password" className="w-full p-2 border rounded bg-white dark:bg-slate-900 dark:border-slate-700 text-sm" value={settings.phonePeSaltKey || ''} onChange={e => setSettings({...settings, phonePeSaltKey: e.target.value})} placeholder="Salt Key" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Salt Index</label>
                                    <input type="text" className="w-full p-2 border rounded bg-white dark:bg-slate-900 dark:border-slate-700 text-sm" value={settings.phonePeSaltIndex || ''} onChange={e => setSettings({...settings, phonePeSaltIndex: e.target.value})} placeholder="1" />
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
              </div>

               <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-lg shadow-sm"><Globe size={24} /></div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Google Analytics</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Enter your measurement ID (G-XXXXXXXXXX)</p>
                    </div>
                 </div>
                 <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg font-mono text-sm dark:bg-slate-950 dark:border-slate-700" 
                    placeholder="G-XXXXXXXXXX"
                    value={settings.googleAnalyticsId || ''} 
                    onChange={e => setSettings({...settings, googleAnalyticsId: e.target.value})} 
                 />
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 p-2.5 rounded-lg shadow-sm"><Tag size={24} /></div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tax / GST Rates</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Manage available tax rates for products</p>
                    </div>
                 </div>
                 <div className="flex gap-2 mb-4">
                     <input 
                        type="number" 
                        placeholder="Rate %" 
                        className="flex-1 p-2 border rounded dark:bg-slate-950 dark:border-slate-700" 
                        value={newTaxRate}
                        onChange={e => setNewTaxRate(e.target.value)}
                     />
                     <button type="button" onClick={handleAddTaxRate} className="bg-slate-900 dark:bg-slate-700 text-white px-4 rounded hover:bg-slate-800">Add</button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                     {(settings.taxRates || []).map(rate => (
                         <div key={rate} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                             {rate}% 
                             <button type="button" onClick={() => handleRemoveTaxRate(rate)} className="text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                         </div>
                     ))}
                 </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2.5 rounded-lg shadow-sm"><Globe size={24} /></div>
                    <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">Home Page SEO</h3></div>
                </div>
                <div className="space-y-4">
                   <div><label className="block text-sm font-medium mb-1">Meta Title</label><input type="text" className="w-full p-2 border rounded dark:bg-slate-950 dark:border-slate-700" value={settings.homeSeo?.metaTitle || ''} onChange={e => setSettings({...settings, homeSeo: {...settings.homeSeo!, metaTitle: e.target.value}})} /></div>
                   <div><label className="block text-sm font-medium mb-1">Meta Description</label><textarea className="w-full p-2 border rounded h-20 dark:bg-slate-950 dark:border-slate-700" value={settings.homeSeo?.metaDescription || ''} onChange={e => setSettings({...settings, homeSeo: {...settings.homeSeo!, metaDescription: e.target.value}})} /></div>
                   <div><label className="block text-sm font-medium mb-1">Keywords</label><input type="text" className="w-full p-2 border rounded dark:bg-slate-950 dark:border-slate-700" value={settings.homeSeo?.keywords || ''} onChange={e => setSettings({...settings, homeSeo: {...settings.homeSeo!, keywords: e.target.value}})} /></div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-xl border border-green-200 dark:border-green-900/50 shadow-sm">
                 <div><label className="block text-sm font-bold text-green-900 dark:text-green-400 mb-1">WhatsApp Number</label><input type="text" className="w-full p-3 border border-green-300 dark:border-green-800 rounded-lg dark:bg-slate-950" value={settings.whatsappNumber} onChange={e => setSettings({...settings, whatsappNumber: e.target.value})} /></div>
              </div>

              <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-sm"><Save size={18} /> Save All Settings</button>
            </form>
          )}

          {activeTab === 'production' && (
              <div className="animate-in fade-in space-y-10 max-w-4xl">
                  <div className="flex items-center gap-4 mb-8">
                      <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <Rocket size={32} />
                      </div>
                      <div>
                          <h3 className="text-2xl font-bold dark:text-white">Production Deployment Guide</h3>
                          <p className="text-slate-500 dark:text-slate-400">Step-by-step instructions to link your secure backend</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold mb-4">1</div>
                          <h4 className="font-bold mb-2">Create Secrets</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">Go to <strong>Secret Manager</strong> in GCP and create 3 secrets: MONGO_URI, JWT_SECRET, and API_KEY.</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold mb-4">2</div>
                          <h4 className="font-bold mb-2">Edit Cloud Run</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">Go to <strong>Cloud Run</strong>, click your service, then click <strong>EDIT & DEPLOY NEW REVISION</strong>.</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center font-bold mb-4">3</div>
                          <h4 className="font-bold mb-2">Link Secrets</h4>
                          <p className="text-xs text-slate-500 leading-relaxed">In <strong>Variables & Secrets</strong>, add references to your 3 secrets and deploy!</p>
                      </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-8 rounded-2xl">
                      <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-4">
                          <ShieldCheck size={20} /> Having trouble finding the Edit button?
                      </h4>
                      <ul className="space-y-4">
                          <li className="flex gap-4">
                              <div className="bg-blue-200 dark:bg-blue-800 h-2 w-2 rounded-full mt-2 shrink-0"></div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <strong>If you see "DEPLOY A CONTAINER":</strong> You are on the main Cloud Run list. You must click the <strong>NAME</strong> of your app in the list first to enter the "Service Details" page.
                              </p>
                          </li>
                          <li className="flex gap-4">
                              <div className="bg-blue-200 dark:bg-blue-800 h-2 w-2 rounded-full mt-2 shrink-0"></div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <strong>Once inside:</strong> The <span className="font-bold">EDIT & DEPLOY NEW REVISION</span> button is in the top white header bar. On small laptops, it might be hidden inside the <strong>three vertical dots (⋮)</strong> menu.
                              </p>
                          </li>
                          <li className="flex gap-4">
                              <div className="bg-blue-200 dark:bg-blue-800 h-2 w-2 rounded-full mt-2 shrink-0"></div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <strong>Secret Manager Access:</strong> Make sure to give the <strong>Secret Manager Secret Accessor</strong> role to your Cloud Run service account in the IAM dashboard.
                              </p>
                          </li>
                      </ul>
                  </div>

                  <div className="flex justify-center pt-8">
                      <a 
                        href="https://console.cloud.google.com/run" 
                        target="_blank" 
                        className="bg-slate-900 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                      >
                          Open Google Cloud Console <ExternalLink size={18} />
                      </a>
                  </div>
              </div>
          )}

          {activeTab === 'pages' && view === 'list' && (
            <div className="animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold">Custom Pages</h3>
                 <button onClick={handlePageCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Add New Page</button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700"><tr><th className="p-4">Title</th><th className="p-4">Slug</th><th className="p-4">Menu</th><th className="p-4">Footer</th><th className="p-4 text-right">Actions</th></tr></thead>
                  <tbody>{pages.map(page => (<tr key={page.id} className="border-b dark:border-slate-700 last:border-0 hover:bg-white dark:hover:bg-slate-900"><td className="p-4 font-medium">{page.title}</td><td className="p-4 text-sm font-mono">{page.slug}</td><td className="p-4">{page.showInMenu && <CheckCircle size={14} className="text-blue-600"/>}</td><td className="p-4">{page.showInFooter && <CheckCircle size={14} className="text-green-600"/>}</td><td className="p-4 text-right"><button onClick={()=>handlePageEdit(page)} className="text-blue-600 mr-2"><Edit size={16}/></button><button onClick={(e)=>handlePageDelete(page.id, e)} className="text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pages' && view === 'form' && (
             <div className="animate-in slide-in-from-right">
               <div className="flex items-center gap-4 mb-6"><button onClick={() => setView('list')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><ArrowRight className="rotate-180" size={24} /></button><h3 className="text-xl font-bold">{editingPageId ? 'Edit Page' : 'Create Page'}</h3></div>
               <form onSubmit={handlePageSave} className="space-y-6 max-w-4xl">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div><label className="block text-sm font-medium mb-1">Page Title</label><input required type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700" value={pageFormData.title} onChange={e => setPageFormData({...pageFormData, title: e.target.value})} /></div>
                   <div><label className="block text-sm font-medium mb-1">Slug (URL)</label><input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-950 dark:border-slate-700" value={pageFormData.slug} onChange={e => setPageFormData({...pageFormData, slug: e.target.value})} /></div>
                   <div className="md:col-span-2 grid grid-cols-2 gap-4">
                     <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><input type="checkbox" className="w-5 h-5 accent-blue-600" checked={pageFormData.showInMenu || false} onChange={e => setPageFormData({...pageFormData, showInMenu: e.target.checked})} /><div><span className="font-bold text-slate-900 dark:text-white block flex items-center gap-2"><Menu size={16}/> Show in Header Menu</span></div></label>
                     <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"><input type="checkbox" className="w-5 h-5 accent-blue-600" checked={pageFormData.showInFooter !== false} onChange={e => setPageFormData({...pageFormData, showInFooter: e.target.checked})} /><div><span className="font-bold text-slate-900 dark:text-white block flex items-center gap-2"><LayoutDashboard size={16}/> Show in Footer</span></div></label>
                   </div>
                 </div>
                 <div><label className="block text-sm font-medium mb-1">Content</label><RichTextEditor value={pageFormData.content} onChange={(val) => setPageFormData({...pageFormData, content: val})} className="min-h-[400px]" /></div>
                 <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"><Save size={18} /> Save Page</button>
               </form>
             </div>
          )}
          
          {activeTab === 'menu' && (
              <div className="animate-in fade-in space-y-8">
                  <div>
                      <h3 className="text-lg font-bold mb-4">Product Categories (Top Level)</h3>
                      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
                                  <tr>
                                      <th className="p-4 w-20">Sort</th>
                                      <th className="p-4">Category Name</th>
                                      <th className="p-4">Visible in Menu</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {categories.filter(c => !c.parentId).map(cat => (
                                      <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                          <td className="p-4">
                                              <input 
                                                type="number" 
                                                className="w-16 p-1 border rounded text-center dark:bg-slate-950 dark:border-slate-700" 
                                                value={cat.sortOrder ?? 0}
                                                onChange={(e) => updateCategoryOrder(cat, Number(e.target.value))}
                                              />
                                          </td>
                                          <td className="p-4 font-medium">{cat.name}</td>
                                          <td className="p-4">
                                              <label className="relative inline-flex items-center cursor-pointer">
                                                  <input type="checkbox" className="sr-only peer" checked={cat.showInMenu !== false} onChange={() => toggleCategoryMenu(cat)} />
                                                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                              </label>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'footer' && (
              <div className="animate-in fade-in space-y-8">
                  <div>
                      <h3 className="text-lg font-bold mb-4">Quick Links (Categories in Footer)</h3>
                      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
                                  <tr>
                                      <th className="p-4">Category Name</th>
                                      <th className="p-4">Visible in Footer</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {categories.filter(c => !c.parentId).map(cat => (
                                      <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                          <td className="p-4 font-medium">{cat.name}</td>
                                          <td className="p-4">
                                              <label className="relative inline-flex items-center cursor-pointer">
                                                  <input type="checkbox" className="sr-only peer" checked={cat.showInFooter !== false} onChange={() => toggleCategoryFooter(cat)} />
                                                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                              </label>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
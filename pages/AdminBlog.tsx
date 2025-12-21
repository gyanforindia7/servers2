
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getBlogPosts, saveBlogPost, deleteBlogPost } from '../services/db';
import { BlogPost } from '../types';
import { Plus, Trash2, Edit, Save, ArrowRight, Search, Newspaper } from '../components/Icons';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImageUploader } from '../components/ImageUploader';

export const AdminBlog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  
  const initialForm: BlogPost = {
    id: '', title: '', slug: '', excerpt: '', content: '', coverImage: '', author: 'Admin', date: '', tags: [], 
    seo: { metaTitle: '', metaDescription: '', keywords: '', canonicalUrl: '', robots: 'index, follow' }
  };
  const [formData, setFormData] = useState<BlogPost>(initialForm);
  const [tagsInput, setTagsInput] = useState('');

  const refresh = () => setPosts(getBlogPosts());
  useEffect(() => { refresh(); }, []);

  const handleEdit = (post: BlogPost) => {
    setFormData({ ...post, seo: { ...initialForm.seo, ...post.seo } });
    setTagsInput(post.tags.join(', '));
    setView('form');
  };

  const handleCreate = () => {
    setFormData({ ...initialForm, id: `blog-${Date.now()}`, date: new Date().toISOString() });
    setTagsInput('');
    setView('form');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = formData.slug || formData.title.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    saveBlogPost({ ...formData, slug, tags });
    setView('list'); refresh();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('Delete this article?')) { deleteBlogPost(id); refresh(); }
  };

  return (
    <AdminLayout>
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-bold text-slate-900">Blog Management</h2><button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700"><Plus size={20} /> Write Article</button></div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left min-w-[700px]"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4">Article</th><th className="p-4">Date</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{posts.map(p => (<tr key={p.id} className="hover:bg-slate-50"><td className="p-4"><div className="flex items-center gap-3"><img src={p.coverImage} className="w-10 h-10 rounded object-cover bg-slate-200" alt="" /><span className="font-bold text-slate-900 line-clamp-1 max-w-xs">{p.title}</span></div></td><td className="p-4 text-sm text-slate-500">{new Date(p.date).toLocaleDateString()}</td><td className="p-4 text-right"><div className="flex justify-end gap-2"><button type="button" onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button><button type="button" onClick={(e) => handleDelete(p.id, e)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button></div></td></tr>))}</tbody></table></div></div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center"><div className="flex items-center gap-4"><button onClick={() => setView('list')} className="text-slate-500 hover:text-slate-800"><ArrowRight className="rotate-180" size={24} /></button><h3 className="text-xl font-bold">{formData.id ? 'Edit Article' : 'New Article'}</h3></div></div>
          <div className="p-8 max-w-4xl mx-auto">
            <form onSubmit={handleSave} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Article Title</label><input required type="text" className="w-full p-3 border rounded-lg text-lg font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                <div><label className="block text-sm font-medium mb-1">Slug (URL)</label><input type="text" className="w-full p-3 border rounded-lg font-mono text-sm" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium mb-1">Tags</label><input type="text" className="w-full p-3 border rounded-lg" value={tagsInput} onChange={e => setTagsInput(e.target.value)} /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Cover Image</label><ImageUploader currentImage={formData.coverImage} onImageChange={(url) => setFormData({...formData, coverImage: url})} /></div>
              <div><label className="block text-sm font-medium mb-1">Excerpt</label><textarea className="w-full p-3 border rounded-lg h-24" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} /></div>
              <div><label className="block text-sm font-medium mb-1">Content</label><RichTextEditor value={formData.content} onChange={(val) => setFormData({...formData, content: val})} className="min-h-[400px]" /></div>
              <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2"><Search size={20} /> Advanced SEO</h4>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Meta Title</label><input type="text" className="w-full p-2 border rounded" value={formData.seo?.metaTitle} onChange={e => setFormData({...formData, seo: {...formData.seo!, metaTitle: e.target.value}})} /></div>
                    <div><label className="block text-sm font-medium mb-1">Meta Description</label><textarea className="w-full p-2 border rounded h-20" value={formData.seo?.metaDescription} onChange={e => setFormData({...formData, seo: {...formData.seo!, metaDescription: e.target.value}})} /></div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium mb-1">Canonical URL</label><input type="text" className="w-full p-2 border rounded" value={formData.seo?.canonicalUrl || ''} onChange={e => setFormData({...formData, seo: {...formData.seo!, canonicalUrl: e.target.value}})} /></div>
                        <div><label className="block text-sm font-medium mb-1">Robots</label><select className="w-full p-2 border rounded bg-white" value={formData.seo?.robots || 'index, follow'} onChange={e => setFormData({...formData, seo: {...formData.seo!, robots: e.target.value}})}><option>index, follow</option><option>noindex, nofollow</option></select></div>
                    </div>
                  </div>
              </section>
              <div className="flex gap-4 pt-4"><button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"><Save size={18} /> Publish Article</button><button type="button" onClick={() => setView('list')} className="text-slate-600 px-6 py-3 hover:bg-slate-100 rounded-lg">Cancel</button></div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

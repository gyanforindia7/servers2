
import React, { useState, useEffect } from 'react';
import { getBlogPosts } from '../services/db';
import { BlogPost } from '../types';
import { SEO } from '../components/SEO';
import { BlogCard } from '../components/BlogCard';
import { Search } from '../components/Icons';

export const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
        setLoading(true);
        try {
            const result = await getBlogPosts();
            setPosts([...(result || [])].reverse());
        } finally {
            setLoading(false);
        }
    };
    loadPosts();
  }, []);

  const filteredPosts = posts.filter(p => {
    const titleMatch = (p.title || '').toLowerCase().includes(search.toLowerCase());
    const tagsMatch = (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return titleMatch || tagsMatch;
  });

  return (
    <>
      <SEO title="Blog" description="Insights, news, and guides on enterprise hardware technology." />
      
      <div className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Tech Insights</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">Latest news, trends, and expert guides from the world of enterprise infrastructure.</p>
        </div>
      </div>

      <div className="bg-slate-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          
          {/* Search */}
          <div className="max-w-md mx-auto mb-12 relative">
             <input 
              type="text" 
              placeholder="Search articles..." 
              className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none dark:bg-white dark:text-slate-900"
              value={search}
              onChange={e => setSearch(e.target.value)}
             />
             <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1,2,3].map(i => <div key={i} className="h-80 bg-slate-200 rounded-xl animate-pulse"></div>)}
             </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-slate-500">No articles found matching your criteria.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

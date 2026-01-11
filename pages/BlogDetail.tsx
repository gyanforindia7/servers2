
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
// Fix: Destructure from namespace import with any cast to resolve environment export issues
const { useParams, Link } = ReactRouterDOM as any;
import { getBlogPostBySlug, getBlogPosts } from '../services/db';
import { BlogPost } from '../types';
import { SEO } from '../components/SEO';
import { Calendar, User, Tag, ArrowRight } from '../components/Icons';

export const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (slug) {
        setLoading(true);
        try {
            const p = await getBlogPostBySlug(slug);
            setPost(p);
            const allPosts = await getBlogPosts();
            setRecentPosts((allPosts || []).filter(b => b.slug !== slug).slice(0, 3));
        } catch (err) {
            console.error("Failed to load blog post:", err);
        } finally {
            setLoading(false);
            window.scrollTo(0,0);
        }
      }
    };
    loadPost();
  }, [slug]);

  if (loading) return <div className="p-20 text-center text-slate-500">Loading article...</div>;
  if (!post) return <div className="p-20 text-center text-slate-500">Article not found.</div>;

  const formattedDate = post.date ? new Date(post.date).toLocaleDateString() : 'Recent';
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <>
      <SEO 
        title={post.seo?.metaTitle || post.title} 
        description={post.seo?.metaDescription || post.excerpt} 
        image={post.coverImage}
        type="article"
      />

      <article className="bg-white dark:bg-slate-950 min-h-screen pb-16">
        {/* Cover */}
        <div className="h-[400px] w-full relative">
           <div className="absolute inset-0 bg-black/40"></div>
           <img src={post.coverImage || 'https://picsum.photos/seed/blog/1200/400'} alt="" className="w-full h-full object-cover" />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="container mx-auto px-4 text-center text-white">
                <div className="flex justify-center gap-2 mb-4">
                  {tags.map(t => (
                    <span key={t} className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{t}</span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight max-w-4xl mx-auto">{post.title}</h1>
                <div className="flex justify-center items-center gap-6 text-sm md:text-base">
                   <span className="flex items-center gap-2"><User size={16} /> {post.author || 'Admin'}</span>
                   <span className="flex items-center gap-2"><Calendar size={16} /> {formattedDate}</span>
                </div>
             </div>
           </div>
        </div>

        <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
           {/* Main Content */}
           <div className="lg:col-span-3">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-blue-600 prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />
           </div>

           {/* Sidebar */}
           <div className="space-y-8">
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Recent Articles</h3>
                <div className="space-y-4">
                  {recentPosts.map(p => (
                    <Link key={p.id} to={`/blog/${p.slug}`} className="block group">
                       <h4 className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">{p.title}</h4>
                       <span className="text-xs text-slate-500">{p.date ? new Date(p.date).toLocaleDateString() : 'Recent'}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-600 text-white p-6 rounded-xl text-center shadow-xl shadow-blue-500/20">
                 <h3 className="font-bold text-lg mb-2">Need Enterprise Hardware?</h3>
                 <p className="text-blue-100 text-sm mb-4">Get custom quotes for servers, storage, and workstations.</p>
                 <Link to="/contact" className="inline-block bg-white text-blue-600 font-bold px-6 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors">Contact Sales</Link>
              </div>
           </div>
        </div>
      </article>
    </>
  );
};

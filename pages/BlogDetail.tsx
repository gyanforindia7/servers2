
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
        const p = await getBlogPostBySlug(slug);
        setPost(p);
        const allPosts = await getBlogPosts();
        setRecentPosts(allPosts.filter(b => b.slug !== slug).slice(0, 3));
        setLoading(false);
        window.scrollTo(0,0);
      }
    };
    loadPost();
  }, [slug]);

  if (loading) return <div className="p-20 text-center text-slate-500">Loading article...</div>;
  if (!post) return <div className="p-20 text-center text-slate-500">Article not found.</div>;

  return (
    <>
      <SEO 
        title={post.seo?.metaTitle || post.title} 
        description={post.seo?.metaDescription || post.excerpt} 
        image={post.coverImage}
        type="article"
      />

      <article className="bg-white min-h-screen pb-16">
        {/* Cover */}
        <div className="h-[400px] w-full relative">
           <div className="absolute inset-0 bg-black/40"></div>
           <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="container mx-auto px-4 text-center text-white">
                <div className="flex justify-center gap-2 mb-4">
                  {post.tags.map(t => (
                    <span key={t} className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{t}</span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight max-w-4xl mx-auto">{post.title}</h1>
                <div className="flex justify-center items-center gap-6 text-sm md:text-base">
                   <span className="flex items-center gap-2"><User size={16} /> {post.author}</span>
                   <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(post.date).toLocaleDateString()}</span>
                </div>
             </div>
           </div>
        </div>

        <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
           {/* Main Content */}
           <div className="lg:col-span-3">
              <div 
                className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-blue-600 prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: post.content }} 
              />
           </div>

           {/* Sidebar */}
           <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">Recent Articles</h3>
                <div className="space-y-4">
                  {recentPosts.map(p => (
                    <Link key={p.id} to={`/blog/${p.slug}`} className="block group">
                       <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">{p.title}</h4>
                       <span className="text-xs text-slate-500">{new Date(p.date).toLocaleDateString()}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              <div className="bg-blue-600 text-white p-6 rounded-xl text-center">
                 <h3 className="font-bold text-lg mb-2">Need Enterprise Hardware?</h3>
                 <p className="text-blue-100 text-sm mb-4">Get custom quotes for servers, storage, and workstations.</p>
                 <Link to="/contact" className="inline-block bg-white text-blue-600 font-bold px-6 py-2 rounded-lg text-sm hover:bg-blue-50">Contact Sales</Link>
              </div>
           </div>
        </div>
      </article>
    </>
  );
};

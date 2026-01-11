
import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
// Fix: Destructure from namespace import with any cast to resolve environment export issues
const { useParams } = ReactRouterDOM as any;
import { getPageBySlug } from '../services/db';
import { PageContent } from '../types';
import { SEO } from '../components/SEO';

export const DynamicPage: React.FC = () => {
  // Fix: Removed generic type parameter from untyped useParams call
  const { slug } = useParams();
  const [page, setPage] = useState<PageContent | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      if (slug) {
        setLoading(true);
        try {
          const p = await getPageBySlug(slug);
          setPage(p);
        } catch (err) {
          console.error("Error loading page:", err);
        } finally {
          setLoading(false);
        }
        window.scrollTo(0, 0);
      }
    };
    loadPage();
  }, [slug]);

  if (loading) return <div className="p-20 text-center text-slate-500">Loading page...</div>;
  if (!page) return <div className="p-20 text-center text-slate-500">Page not found</div>;

  return (
    <>
      <SEO 
        title={page.seo?.metaTitle || page.title} 
        description={page.seo?.metaDescription} 
        type="article"
      />
      
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-6">
              {page.title}
            </h1>
            
            <div 
              className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-blue-600"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

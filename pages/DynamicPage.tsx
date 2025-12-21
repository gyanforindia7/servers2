import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getPageBySlug } from '../services/db';
import { PageContent } from '../types';
import { SEO } from '../components/SEO';

export const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageContent | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      const p = getPageBySlug(slug);
      setPage(p);
      setLoading(false);
      window.scrollTo(0, 0);
    }
  }, [slug]);

  if (loading) return null;
  if (!page) return <div className="p-20 text-center text-slate-500">Page not found</div>;

  return (
    <>
      <SEO 
        title={page.seo?.metaTitle || page.title} 
        description={page.seo?.metaDescription} 
        type="article"
      />
      
      <div className="bg-slate-50 min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-6">
              {page.title}
            </h1>
            
            <div 
              className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-blue-600"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </div>
    </>
  );
};
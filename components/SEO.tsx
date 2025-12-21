
import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  canonicalUrl?: string; // New
  robots?: string; // New
  ogImage?: string; // New override
}

export const SEO: React.FC<SEOProps> = ({ 
    title, 
    description, 
    image, 
    url, 
    type = 'website',
    canonicalUrl,
    robots,
    ogImage 
}) => {
  const siteTitle = `${title} | SERVERS 2`;
  const siteUrl = url || window.location.href;
  const siteImage = ogImage || image || 'https://serverpro-elite.com/og-image.jpg'; // Prefer OG Image override if set

  useEffect(() => {
    document.title = siteTitle;
    
    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    if (description) {
      metaDesc.setAttribute('content', description);
    } else {
        metaDesc.removeAttribute('content');
    }

    // Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl || siteUrl);

    // Robots Meta
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.setAttribute('name', 'robots');
        document.head.appendChild(robotsMeta);
    }
    if (robots) {
        robotsMeta.setAttribute('content', robots);
    } else {
        robotsMeta.setAttribute('content', 'index, follow');
    }

    // Open Graph
    const setMeta = (name: string, content: string) => {
        let el = document.querySelector(`meta[property="${name}"]`);
        if (!el) {
            el = document.createElement('meta');
            el.setAttribute('property', name);
            document.head.appendChild(el);
        }
        el.setAttribute('content', content);
    };

    setMeta('og:title', siteTitle);
    setMeta('og:description', description || '');
    setMeta('og:image', siteImage);
    setMeta('og:url', canonicalUrl || siteUrl);
    setMeta('og:type', type);
    setMeta('og:site_name', 'SERVERS 2');

  }, [title, description, siteUrl, siteImage, type, canonicalUrl, robots, ogImage]);

  return null;
};

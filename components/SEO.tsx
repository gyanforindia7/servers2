import React, { useEffect } from 'react';
import { useApp } from '../App';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonicalUrl?: string;
  robots?: string;
  ogImage?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
    title, 
    description, 
    keywords,
    image, 
    url, 
    type = 'website',
    canonicalUrl,
    robots,
    ogImage 
}) => {
  const { settings } = useApp();
  
  const baseTitle = 'SERVERS 2';
  const siteTitle = title ? title : `${baseTitle} | Enterprise IT Solutions`;
  const siteUrl = url || window.location.href;
  const siteImage = ogImage || image || settings.logoUrl || '';

  useEffect(() => {
    // 1. Force Update Document Title (updates <title> Dell PowerEdge R750 </title>)
    document.title = siteTitle;
    
    // 2. Manage Favicon
    if (settings.faviconUrl) {
      let links: HTMLLinkElement[] = Array.from(document.querySelectorAll("link[rel*='icon']"));
      if (links.length === 0) {
        const link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
        links = [link];
      }
      links.forEach(link => {
        link.href = settings.faviconUrl || '';
      });
    }

    // Helper to find/create meta tag
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 3. Metadata Updates (Directly updates meta html code)
    const metaDesc = description || settings.homeSeo?.metaDescription || 'Premium enterprise hardware, servers, storage, and workstations.';
    const metaKeys = keywords || settings.homeSeo?.keywords || 'servers, enterprise it, hardware, storage';

    updateMeta('description', metaDesc);
    updateMeta('keywords', metaKeys);
    updateMeta('robots', robots || 'index, follow');

    // 4. Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl || siteUrl.split('#')[0]);

    // 5. Open Graph / Social
    updateMeta('og:title', siteTitle, true);
    updateMeta('og:description', metaDesc, true);
    updateMeta('og:image', siteImage, true);
    updateMeta('og:url', siteUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', baseTitle, true);

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', siteTitle);
    updateMeta('twitter:description', metaDesc);
    updateMeta('twitter:image', siteImage);

  }, [siteTitle, description, keywords, siteUrl, siteImage, type, canonicalUrl, robots, settings.faviconUrl, settings.homeSeo]);

  return null;
};
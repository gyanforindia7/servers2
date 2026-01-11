
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
  const siteTitle = title ? `${title} | SERVERS 2` : 'SERVERS 2 | Enterprise IT Solutions';
  const siteUrl = url || window.location.href;
  const siteImage = ogImage || image || settings.logoUrl || 'https://serverpro-elite.com/og-image.jpg';

  useEffect(() => {
    // 1. Update Document Title
    document.title = siteTitle;
    
    // 2. Manage Favicon
    if (settings.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }

    // Helper to find/create meta tag
    const setMeta = (attr: string, value: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${value}"]` : `meta[name="${value}"]`;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(isProperty ? 'property' : 'name', value);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 3. Description & Keywords
    if (description) setMeta('name', 'description', description);
    if (keywords || settings.homeSeo?.keywords) {
        setMeta('name', 'keywords', keywords || settings.homeSeo?.keywords || '');
    }

    // 4. Robots
    setMeta('name', 'robots', robots || 'index, follow');

    // 5. Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl || siteUrl);

    // 6. Open Graph
    setMeta('property', 'og:title', siteTitle, true);
    setMeta('property', 'og:description', description || '', true);
    setMeta('property', 'og:image', siteImage, true);
    setMeta('property', 'og:url', canonicalUrl || siteUrl, true);
    setMeta('property', 'og:type', type, true);
    setMeta('property', 'og:site_name', 'SERVERS 2', true);

  }, [siteTitle, description, keywords, siteUrl, siteImage, type, canonicalUrl, robots, settings.faviconUrl, settings.homeSeo?.keywords, ogImage]);

  return null;
};

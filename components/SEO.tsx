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
    // 1. Force Update Document Title (Updates the <title> tag in HTML)
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

    // Helper to robustly find/update or create meta tag
    const updateMetaTag = (attrName: string, attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 3. Metadata Updates (Directly updates meta html code)
    const metaDesc = description || settings.homeSeo?.metaDescription || 'Premium enterprise hardware, servers, storage, and workstations.';
    const metaKeys = keywords || settings.homeSeo?.keywords || 'servers, enterprise it, hardware, storage';

    // Standard Meta Tags
    updateMetaTag('name', 'description', metaDesc);
    updateMetaTag('name', 'keywords', metaKeys);
    updateMetaTag('name', 'robots', robots || 'index, follow');

    // 4. Canonical Link Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl || siteUrl.split('#')[0]);

    // 5. Open Graph / Social Media Meta Tags
    updateMetaTag('property', 'og:title', siteTitle);
    updateMetaTag('property', 'og:description', metaDesc);
    updateMetaTag('property', 'og:image', siteImage);
    updateMetaTag('property', 'og:url', siteUrl);
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('property', 'og:site_name', baseTitle);

    // 6. Twitter Specific Meta Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', siteTitle);
    updateMetaTag('name', 'twitter:description', metaDesc);
    updateMetaTag('name', 'twitter:image', siteImage);

  }, [siteTitle, description, keywords, siteUrl, siteImage, type, canonicalUrl, robots, settings.faviconUrl, settings.homeSeo]);

  return null;
};
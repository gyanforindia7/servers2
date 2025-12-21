
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from './Icons';
import { getProductBySlug, getCategoryBySlug, getCategories } from '../services/db';
import { Category } from '../types';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const [items, setItems] = useState<{ name: string; path: string }[]>([]);

  useEffect(() => {
    const buildBreadcrumbs = async () => {
      if (pathnames.length === 0) {
        setItems([]);
        return;
      }

      let breadcrumbs: { name: string; path: string }[] = [];

      // Helper to build category tree
      const buildCategoryPath = async (catSlug: string) => {
        const allCats = await getCategories();
        const currentCat = allCats.find(c => c.slug === catSlug);
        
        const pathItems: { name: string; path: string }[] = [];
        
        if (currentCat) {
          // Check for Parent
          if (currentCat.parentId) {
            const parent = allCats.find(c => c.id === currentCat.parentId);
            if (parent) {
              pathItems.push({ name: parent.name, path: `/category/${parent.slug}` });
            }
          }
          // Add Current
          pathItems.push({ name: currentCat.name, path: `/category/${currentCat.slug}` });
        } else {
            // Fallback if category deleted but slug remains in URL
            const fallbackName = catSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            pathItems.push({ name: fallbackName, path: `/category/${catSlug}` });
        }
        return pathItems;
      };

      if (pathnames[0] === 'product' && pathnames[1]) {
        // 1. Product Detail Page
        const productSlug = pathnames[1];
        const product = await getProductBySlug(productSlug);
        
        if (product) {
          // Find the category object that matches the product's category name
          const allCats = await getCategories();
          const productCat = allCats.find(c => c.name === product.category);

          if (productCat) {
              breadcrumbs = [...breadcrumbs, ...(await buildCategoryPath(productCat.slug))];
          } else {
              // Fallback if category object missing
              breadcrumbs.push({ name: product.category, path: `/search?q=${product.category}` });
          }

          // Add Product Name (Active)
          breadcrumbs.push({
            name: product.name,
            path: location.pathname
          });
        } else {
          // Fallback
          breadcrumbs.push({ name: 'Product', path: location.pathname });
        }
      } 
      else if (pathnames[0] === 'category' && pathnames[1]) {
        // 2. Category Page
        breadcrumbs = [...breadcrumbs, ...(await buildCategoryPath(pathnames[1]))];
      } 
      else {
        // 3. Default / Generic Pages (Cart, Contact, Admin, etc.)
        breadcrumbs = pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          // Manual overrides for prettier names
          let formattedName = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          if (name === 'cart') formattedName = 'Shopping Cart';
          if (name === 'contact') formattedName = 'Contact Us';
          if (name === 'checkout') formattedName = 'Checkout';
          
          return {
            name: formattedName,
            path: routeTo
          };
        });
      }
      setItems(breadcrumbs);
    };
    buildBreadcrumbs();
  }, [location.pathname]);

  // Don't show on home page
  if (pathnames.length === 0) return null;

  // Generate JSON-LD Schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": window.location.origin
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.name,
        // Ensure the URL matches the actual app structure (HashRouter)
        "item": `${window.location.origin}/#${item.path}`
      }))
    ]
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
      <nav className="bg-slate-50 border-b border-slate-200 py-3" aria-label="Breadcrumb">
        <div className="container mx-auto px-4">
          <ol className="flex items-center flex-wrap gap-y-2 text-sm text-slate-500">
            <li>
              <Link to="/" className="hover:text-blue-600 flex items-center">
                <Home size={14} className="mr-1" /> Home
              </Link>
            </li>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <li key={item.path} className="flex items-center">
                  <ChevronRight size={14} className="mx-1 text-slate-400 flex-shrink-0" />
                  {isLast ? (
                    <span className="font-semibold text-slate-900 truncate max-w-[200px] md:max-w-[400px]" aria-current="page">
                      {item.name}
                    </span>
                  ) : (
                    <Link to={item.path} className="hover:text-blue-600 whitespace-nowrap">
                      {item.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
};

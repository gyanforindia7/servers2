
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, getSimilarProducts, formatCurrency } from '../services/db';
import { Product } from '../types';
import { useApp } from '../App';
import { SEO } from '../components/SEO';
import { ShoppingCart, FileText, Check, AlertCircle } from '../components/Icons';
import { ProductCard } from '../components/ProductCard';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart, openQuoteModal } = useApp();
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'faq'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (slug) {
        setLoading(true);
        const p = await getProductBySlug(slug);
        setProduct(p);
        if (p) {
          const similar = await getSimilarProducts(p);
          setSimilarProducts(similar);
        }
        setLoading(false);
        window.scrollTo(0, 0);
      }
    };
    loadProduct();
  }, [slug]);

  if (loading) return <div className="p-20 text-center text-slate-500">Loading product...</div>;
  if (!product) return <div className="p-20 text-center text-slate-500">Product not found.</div>;
  
  if (product.isActive === false) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-center max-w-md">
                 <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertCircle size={32} /></div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Product Unavailable</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-6">This item is currently not available.</p>
                 <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Back to Home</Link>
             </div>
        </div>
      );
  }

  const showBuy = product.allowDirectBuy ?? (product.category === 'Laptops');
  const handleAction = () => showBuy ? addToCart(product, quantity) : openQuoteModal({ id: product.id, name: product.name, quantity });

  const FAQs = [
    { q: "What is the warranty period?", a: "This product comes with a Standard Enterprise Warranty, covering hardware defects and technical support." },
    { q: "Can I customize the specifications?", a: "Yes, we offer full customization for enterprise gear. Request a quote with your requirements." },
    { q: "Do you ship internationally?", a: "Yes, we provide secure global shipping for all hardware." },
    { q: "Is this unit new or refurbished?", a: "Unless specified as 'New', our enterprise equipment is certified refurbished and rigorously tested." }
  ];

  return (
    <>
      <SEO title={product.seo?.metaTitle || product.name} description={product.seo?.metaDescription} image={product.imageUrl} type="product" />
      
      <div className="bg-white dark:bg-slate-900 py-8 md:py-12 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-4 md:p-8 flex items-center justify-center relative">
               <div className={`absolute top-4 left-4 px-3 py-1.5 rounded text-xs font-bold uppercase text-white ${product.condition === 'New' ? 'bg-blue-600' : 'bg-emerald-600'}`}>{product.condition}</div>
               <img src={product.imageUrl} alt={product.name} className="max-w-full h-auto rounded-lg shadow-lg" />
            </div>

            <div>
              <div className="mb-4">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase">{product.category}</span>
                <span className="ml-3 text-slate-500 text-sm font-medium">SKU: {product.sku}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">{product.name}</h1>
              <div className="border-t dark:border-slate-800 pt-8">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    {!showBuy && <span className="text-sm text-slate-500 block mb-1">Inquiry Price</span>}
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">{formatCurrency(product.price)}</span>
                  </div>
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg">
                    <button className="px-4 py-2 text-slate-600 dark:text-slate-400" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <span className="px-4 py-2 font-bold dark:text-white">{quantity}</span>
                    <button className="px-4 py-2 text-slate-600 dark:text-slate-400" onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                </div>
                <button onClick={handleAction} className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${showBuy ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white'}`}>
                  {showBuy ? <><ShoppingCart size={20} /> Add to Cart</> : <><FileText size={20} /> Request a Quote</>}
                </button>
                <div className="mt-6 flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-900/10 dark:text-green-400 px-3 py-2 rounded"><Check size={16} /> Certified & In Stock</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto no-scrollbar">
            {['desc', 'specs', 'faq'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-8 py-4 font-bold text-sm uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                {tab === 'desc' ? 'Overview' : tab === 'specs' ? 'Specs' : 'FAQs'}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            {activeTab === 'desc' && <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />}
            {activeTab === 'specs' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b dark:border-slate-800 pb-2"><span className="text-slate-500">{k}</span><span className="font-bold dark:text-white">{v}</span></div>
                ))}
              </div>
            )}
            {activeTab === 'faq' && <div className="space-y-6">{FAQs.map((f, i) => ( <div key={i}><h4 className="font-bold dark:text-white mb-1">{f.q}</h4><p className="text-sm text-slate-600 dark:text-slate-400">{f.a}</p></div> ))}</div>}
          </div>
        </div>
      </div>
      
      {similarProducts.length > 0 && (
        <div className="py-16 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 dark:text-white">You Might Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">{similarProducts.map(p => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        </div>
      )}
    </>
  );
};

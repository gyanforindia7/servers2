
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

  if (loading) {
    return <div className="p-20 text-center">Loading...</div>;
  }

  if (!product) {
    return <div className="p-20 text-center">Product not found</div>;
  }
  
  // If product is inactive, show unavailable message
  if (product.isActive === false) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
             <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-md">
                 <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <AlertCircle size={32} />
                 </div>
                 <h2 className="text-xl font-bold text-slate-900 mb-2">Product Unavailable</h2>
                 <p className="text-slate-600 mb-6">This product is currently not available for purchase.</p>
                 <Link to="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Back to Home</Link>
             </div>
        </div>
      );
  }

  // Logic: Use flag or fallback
  const showBuy = product.allowDirectBuy ?? (product.category === 'Laptops');

  const handleAction = () => {
    if (showBuy) {
      addToCart(product, quantity);
    } else {
      openQuoteModal({ id: product.id, name: product.name, quantity });
    }
  };

  const FAQs = [
    { q: "What is the warranty period?", a: "This product comes with a Standard Enterprise Warranty, covering hardware defects and technical support." },
    { q: "Can I customize the specifications?", a: "Yes, for servers and workstations, we offer full customization. Please request a quote with your specific requirements." },
    { q: "Do you ship internationally?", a: "Yes, we ship globally via secure logistics partners." },
    { q: "Is this unit new or refurbished?", a: "Unless explicitly stated as 'New', our enterprise gear is certified refurbished, tested to meet original manufacturer standards." }
  ];

  // --- Advanced Google Merchant Center & LLM Schema ---
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [product.imageUrl],
    "description": product.description.replace(/<[^>]*>?/gm, ''), // Strip tags for schema
    "sku": product.sku,
    "mpn": product.gmc?.mpn || product.sku,
    "gtin": product.gmc?.gtin,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      "itemCondition": product.condition === 'New' ? "https://schema.org/NewCondition" : "https://schema.org/RefurbishedCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "SERVERS 2"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
            "@type": "MonetaryAmount",
            "value": 0,
            "currency": "INR"
        },
        "deliveryTime": {
            "@type": "ShippingDeliveryTime",
            "handlingTime": {
                "@type": "QuantitativeValue",
                "minValue": 1,
                "maxValue": 2,
                "unitCode": "DAY"
            },
            "transitTime": {
                "@type": "QuantitativeValue",
                "minValue": 3,
                "maxValue": 5,
                "unitCode": "DAY"
            }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "IN",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 30,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    }
  };

  return (
    <>
      <SEO 
        title={product.seo?.metaTitle || product.name} 
        description={product.seo?.metaDescription || product.description.replace(/<[^>]*>?/gm, '').substring(0, 160)} 
        image={product.imageUrl}
        type="product"
      />
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
      
      {/* Product Main Section */}
      <div className="bg-white py-8 md:py-12 border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Image */}
            <div className="bg-slate-100 rounded-2xl p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
               <div className={`absolute top-4 left-4 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider shadow-sm text-white ${product.condition === 'New' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {product.condition}
              </div>
              <img src={product.imageUrl} alt={product.name} className="max-w-full h-auto rounded-lg shadow-lg" />
            </div>

            {/* Info */}
            <div>
              <div className="mb-4">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                  {product.category}
                </span>
                <span className="ml-3 text-slate-500 text-sm font-medium">SKU: {product.sku}</span>
              </div>
              
              <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4">{product.name}</h1>
              
              {/* Short Desc (Strip tags for preview) */}
              <div className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed line-clamp-3">
                {product.description.replace(/<[^>]*>?/gm, '')}
              </div>

              {/* Top Specs Preview */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {Object.entries(product.specs).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 p-3 rounded border border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{key}</div>
                    <div className="text-slate-900 font-semibold text-sm">{value}</div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 py-8">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    {!showBuy && <span className="text-sm text-slate-500 block mb-1">Starts at</span>}
                    <span className="text-3xl md:text-4xl font-bold text-slate-900">{formatCurrency(product.price)}</span>
                    {!showBuy && <span className="text-sm text-slate-500 block mt-1">Estimated Base Configuration Price</span>}
                  </div>
                  
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                    <button 
                      className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-l-lg"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >-</button>
                    <span className="px-4 py-2 font-semibold text-slate-900 w-12 text-center">{quantity}</span>
                    <button 
                      className="px-4 py-2 hover:bg-slate-100 text-slate-600 rounded-r-lg"
                      onClick={() => setQuantity(quantity + 1)}
                    >+</button>
                  </div>
                </div>

                <button 
                  onClick={handleAction}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-900/10 ${
                    showBuy 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {showBuy ? (
                    <>
                      <ShoppingCart size={20} /> Add to Cart
                    </>
                  ) : (
                    <>
                      <FileText size={20} /> Request a Quote
                    </>
                  )}
                </button>
                
                <div className="mt-6 flex flex-col gap-2">
                   <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                     <Check size={16} /> In Stock & Ready to Ship
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Tabs */}
      <div className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Tab Headers */}
            <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
              {['desc', 'specs', 'faq'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-8 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'desc' ? 'Description' : tab === 'specs' ? 'Specifications' : 'FAQs'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[300px]">
              {activeTab === 'desc' && (
                <div className="prose max-w-none text-slate-600">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Product Overview</h3>
                  {/* Render HTML Description */}
                  <div dangerouslySetInnerHTML={{ __html: product.description }} />
                  
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p>
                      Engineered for reliability and performance, the {product.name} integrates seamlessly into modern IT infrastructures. 
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                      <li>Enterprise-grade components for 24/7 operation.</li>
                      <li>Scalable architecture to grow with your business needs.</li>
                      <li>Integrated security features to protect sensitive data.</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="space-y-8">
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                       <div className="w-1 h-6 bg-blue-600 rounded"></div> Technical Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                      {Object.entries(product.specs).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-500 font-medium">{key}</span>
                          <span className="text-slate-900 font-semibold text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                  
                  {product.additionalSpecs && Object.keys(product.additionalSpecs).length > 0 && (
                    <section>
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-slate-400 rounded"></div> Additional Specifications
                      </h3>
                      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                            {Object.entries(product.additionalSpecs).map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-slate-200 pb-2 last:border-0">
                                <span className="text-slate-600 font-medium">{key}</span>
                                <span className="text-slate-900 font-bold text-right">{value}</span>
                            </div>
                            ))}
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-6">
                  {FAQs.map((faq, idx) => (
                    <div key={idx}>
                      <h4 className="font-bold text-slate-900 mb-2">{faq.q}</h4>
                      <p className="text-slate-600 text-sm">{faq.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="py-16 bg-white border-t border-slate-200">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

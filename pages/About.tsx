import React, { useEffect, useState } from 'react';
import { SEO } from '../components/SEO';
import { Check, User, Globe } from '../components/Icons';
import { getPageBySlug } from '../services/db';
import { PageContent } from '../types';

export const About: React.FC = () => {
  const [content, setContent] = useState<PageContent | undefined>(undefined);

  useEffect(() => {
    // Fix: Using an async function inside useEffect to properly await the promise
    const loadContent = async () => {
      // Attempt to fetch dynamic content first
      const dynamicAbout = await getPageBySlug('about');
      if (dynamicAbout) setContent(dynamicAbout);
    };
    loadContent();
  }, []);

  return (
    <>
      <SEO 
        title={content?.seo?.metaTitle || "About Us"} 
        description={content?.seo?.metaDescription || "Learn about ServerPro Elite, our mission, and our commitment to providing top-tier enterprise hardware solutions."} 
      />
      
      {/* Hero */}
      <div className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 -skew-x-12 transform translate-x-20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Empowering Enterprise Infrastructure Since 2010</h1>
            <p className="text-xl text-slate-300">
              We bridge the gap between high-performance computing needs and budget constraints, delivering certified, reliable, and scalable hardware solutions globally.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Who We Are</h2>
              {/* Render dynamic content if available, else static fallback */}
              {content ? (
                 <div className="prose text-slate-600" dangerouslySetInnerHTML={{ __html: content.content }} />
              ) : (
                <div className="space-y-4 text-slate-600 leading-relaxed">
                  <p>
                    ServerPro Elite is a premier provider of refurbished and new enterprise IT hardware. Specialized in servers, storage arrays, networking equipment, and workstations.
                  </p>
                  <p>
                    Our mission is simple: <strong>Reliability without Compromise.</strong> We believe that every business deserves access to top-tier infrastructure.
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                 <div className="text-4xl font-bold text-blue-600 mb-2">15k+</div>
                 <div className="text-sm font-medium text-slate-600">Servers Deployed</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                 <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
                 <div className="text-sm font-medium text-slate-600">Countries Served</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                 <div className="text-4xl font-bold text-blue-600 mb-2">99%</div>
                 <div className="text-sm font-medium text-slate-600">Customer Satisfaction</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                 <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                 <div className="text-sm font-medium text-slate-600">Technical Support</div>
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3">Quality Assurance</h3>
                <p className="text-slate-600">Every product undergoes a 25-point inspection process by certified technicians before shipping.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3">Customer First</h3>
                <p className="text-slate-600">We prioritize long-term relationships over quick sales, offering honest advice and post-sales support.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3">Sustainability</h3>
                <p className="text-slate-600">By extending the lifecycle of IT assets, we help reduce e-waste and promote a circular economy.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-6">Ready to upgrade your infrastructure?</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">Get in touch with our specialists today for a custom consultation and quote.</p>
            <a href="#/contact" className="inline-block bg-white text-blue-600 font-bold px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
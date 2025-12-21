import React, { useState } from 'react';
import { SEO } from '../components/SEO';
import { Phone, Mail, MapPin, Check } from '../components/Icons';
import { submitContactMessage } from '../services/db';
import { useApp } from '../App';

export const Contact: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: 'Sales Inquiry',
    message: ''
  });
  
  const { settings } = useApp();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitContactMessage({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      subject: formData.subject,
      message: formData.message
    });
    setSubmitted(true);
    // Reset form
    setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: 'Sales Inquiry',
        message: ''
    });
  };

  return (
    <>
      <SEO title="Contact Us" description="Get in touch with ServerPro Elite for sales inquiries, support, or partnership opportunities." />
      
      {/* Header */}
      <div className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">We're here to help. Reach out to our expert team for quotes, technical support, or general inquiries about our enterprise hardware solutions.</p>
        </div>
      </div>

      <div className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg"><Phone size={24} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Phone Support</h3>
                    <p className="text-slate-600 mb-2">Mon-Fri 9am-6pm IST</p>
                    <a href={`tel:${settings.supportPhone.replace(/[^0-9]/g,'')}`} className="text-blue-600 font-bold hover:underline">{settings.supportPhone}</a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 text-green-600 p-3 rounded-lg"><Mail size={24} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Email Sales</h3>
                    <p className="text-slate-600 mb-2">Typically replies in 2 hours</p>
                    <a href={`mailto:${settings.supportEmail}`} className="text-blue-600 font-bold hover:underline">{settings.supportEmail}</a>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 text-purple-600 p-3 rounded-lg"><MapPin size={24} /></div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">Headquarters</h3>
                    <p className="text-slate-600 whitespace-pre-line">
                      {settings.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              {submitted ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <Check size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h2>
                  <p className="text-slate-600 max-w-md">Thank you for contacting us. A member of our team will get back to you within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)} className="mt-6 text-blue-600 font-bold hover:underline">Send another message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900">Send us a Message</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input required type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
                             value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input required type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
                             value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Doe" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input required type="email" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
                             value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@company.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                      <input type="tel" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
                             value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none bg-white"
                            value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                      <option>Sales Inquiry</option>
                      <option>Technical Support</option>
                      <option>Order Status</option>
                      <option>Partnership</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea required rows={5} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-600 outline-none" 
                              value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="How can we help you today?"></textarea>
                  </div>

                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
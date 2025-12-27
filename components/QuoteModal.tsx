
import React, { useState } from 'react';
import { X, FileText, CheckCircle, Mail, Phone } from './Icons';
import { submitQuote } from '../services/db';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: { id: string; name: string; quantity: number } | null;
}

export const QuoteModal: React.FC<QuoteModalProps> = ({ isOpen, onClose, initialProduct }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await submitQuote({
            products: initialProduct ? [{ productId: initialProduct.id, productName: initialProduct.name, quantity: initialProduct.quantity }] : [],
            customerName: formData.name,
            customerEmail: formData.email,
            message: `${formData.message}\nPhone: ${formData.phone}`,
        });
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', phone: '', message: '' });
            onClose();
        }, 4000);
    } catch (err) {
        alert("There was an issue sending your request. Please try again or contact support directly.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} /> Request a Quote
          </h3>
          <button onClick={onClose} className="hover:text-blue-400 transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-2">Quote Request Received!</h4>
              <p className="text-slate-600 mb-6">Thank you, {formData.name}. We have received your request.</p>
              
              <div className="bg-slate-50 rounded-lg p-6 text-left border border-slate-100 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                      <Mail size={18} className="text-blue-600" />
                      <span className="text-sm text-slate-700">Confirmation sent to <strong>{formData.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                      <Phone size={18} className="text-blue-600" />
                      <span className="text-sm text-slate-700">Our team will contact you at <strong>{formData.phone}</strong> shortly.</span>
                  </div>
              </div>
              
              <p className="text-xs text-slate-400">Closing automatically...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {initialProduct && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                  <span className="text-xs font-bold text-blue-600 uppercase">Inquiring About</span>
                  <div className="font-semibold text-slate-900">{initialProduct.name} (Qty: {initialProduct.quantity})</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input required type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                  <input required type="tel" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                <input required type="email" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message / Specific Requirements (Optional)</label>
                <textarea rows={4} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600" 
                  value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="I need 128GB RAM configuration..." />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/10"
              >
                {isSubmitting ? 'Sending Request...' : 'Submit Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
// Fix: Destructure from namespace import with any cast to resolve environment export issues
const { Link, useNavigate } = ReactRouterDOM as any;
import { useApp } from '../App';
import { SEO } from '../components/SEO';
import { Trash2, ArrowRight } from '../components/Icons';
import { formatCurrency } from '../services/db';

export const Cart: React.FC = () => {
  const { cart, removeFromCart } = useApp();
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate Tax based on individual product tax rates
  const tax = cart.reduce((sum, item) => {
    // Default to 0.18 (18%) if taxRate is not explicitly set, for legacy compatibility
    const rate = item.taxRate !== undefined ? item.taxRate : 0.18;
    return sum + (item.price * item.quantity * rate);
  }, 0);

  const total = subtotal + tax;

  return (
    <>
      <SEO title="Shopping Cart" />
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>

          {cart.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm">
              <p className="text-slate-500 mb-6">Your cart is empty.</p>
              <Link to="/" className="text-blue-600 font-semibold hover:underline">Continue Shopping</Link>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 font-semibold text-slate-600">Product</th>
                      <th className="p-4 font-semibold text-slate-600 hidden sm:table-cell">Price</th>
                      <th className="p-4 font-semibold text-slate-600">Qty</th>
                      <th className="p-4 font-semibold text-slate-600">Total</th>
                      <th className="p-4 font-semibold text-slate-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.map((item) => (
                      <tr key={item.id}>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded bg-slate-100" />
                            <div>
                              <div className="font-medium text-slate-900">{item.name}</div>
                              <div className="text-xs text-slate-500">{item.sku}</div>
                              <div className="sm:hidden text-sm text-slate-600 mt-1">{formatCurrency(item.price)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 hidden sm:table-cell">{formatCurrency(item.price)}</td>
                        <td className="p-4 text-slate-600">{item.quantity}</td>
                        <td className="p-4 font-medium text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="w-full lg:w-96">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-24">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Tax (GST)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex justify-between text-lg font-bold text-slate-900">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/checkout')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    Proceed to Checkout <ArrowRight size={18} />
                  </button>
                  
                  <div className="mt-4 text-center">
                     <p className="text-xs text-slate-400">Secure Checkout via Stripe</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

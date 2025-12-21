
import React, { useEffect, useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { getOrderById, formatCurrency } from '../services/db';
import { Order } from '../types';
import { CheckCircle, Package, ArrowRight } from '../components/Icons';
import { SEO } from '../components/SEO';

export const ThankYou: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const [order, setOrder] = useState<Order | undefined>(undefined);

  useEffect(() => {
    if (orderId) {
      const foundOrder = getOrderById(orderId);
      setOrder(foundOrder);
    }
  }, [orderId]);

  if (!orderId) return <Navigate to="/" />;
  if (!order) return <div className="p-20 text-center">Loading...</div>;

  return (
    <>
      <SEO title="Order Confirmed" />
      <div className="bg-slate-50 min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-green-600 p-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
              <p className="text-green-100 text-lg">Your order #{order.id} has been placed successfully.</p>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-slate-100 pb-8">
                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Shipping Details</h3>
                  <div className="text-slate-900 font-medium">{order.shippingDetails.fullName}</div>
                  <div className="text-slate-600 text-sm whitespace-pre-line mt-1">
                    {order.shippingDetails.address}<br/>
                    {order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}<br/>
                    {order.shippingDetails.country}
                  </div>
                  <div className="text-slate-600 text-sm mt-2">
                    {order.shippingDetails.phone}<br/>
                    {order.shippingDetails.email}
                  </div>
                </div>
                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Order Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-medium text-slate-900">{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Payment Method:</span>
                      <span className="font-medium text-slate-900">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className="font-bold text-green-600">{order.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-slate-900 font-bold mb-4">Items Ordered</h3>
                <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
                      <div className="w-16 h-16 bg-white rounded border border-slate-200 overflow-hidden shrink-0">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 truncate">{item.name}</div>
                        <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center text-lg font-bold text-slate-900">
                  <span>Total Amount</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/dashboard" className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                  <Package size={18} /> Track Order
                </Link>
                <Link to="/" className="bg-white text-slate-900 border border-slate-300 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  Continue Shopping <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

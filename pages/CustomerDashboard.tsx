
import React, { useEffect, useState } from 'react';
import { useApp } from '../App';
import { Navigate } from 'react-router-dom';
import { getUserOrders, formatCurrency } from '../services/db';
import { SEO } from '../components/SEO';
import { Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { Order } from '../types';

export const CustomerDashboard: React.FC = () => {
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
        if (user) {
            const result = await getUserOrders(user.id);
            setOrders(result);
            setLoading(false);
        }
    };
    loadOrders();
  }, [user]);

  if (!user) return <Navigate to="/" />;
  if (loading) return <div className="p-20 text-center">Loading...</div>;

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'Processing': return <div className="flex items-center gap-2 text-sm font-bold bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full"><Package size={14}/> Processing</div>;
          case 'Shipped': return <div className="flex items-center gap-2 text-sm font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full"><Truck size={14}/> Shipped</div>;
          case 'Delivered': return <div className="flex items-center gap-2 text-sm font-bold bg-green-100 text-green-800 px-3 py-1 rounded-full"><CheckCircle size={14}/> Delivered</div>;
          case 'Cancelled': return <div className="flex items-center gap-2 text-sm font-bold bg-red-100 text-red-800 px-3 py-1 rounded-full"><XCircle size={14}/> Cancelled</div>;
          default: return null;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <SEO title="My Account" />
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Dashboard</h1>
        <p className="text-slate-500 mb-8">Welcome back, {user.name}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h3 className="font-bold text-lg mb-4">Profile Information</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Name</span>
                <p className="text-slate-900">{user.name}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Email</span>
                <p className="text-slate-900">{user.email}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase font-semibold">Account Type</span>
                <p className="text-slate-900 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <h3 className="font-bold text-lg mb-4">Order History</h3>
            {orders.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200">
                <Package className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500">You haven't placed any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">Order #{order.id}</div>
                        <div className="text-sm text-slate-500">{new Date(order.date).toLocaleDateString()}</div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="p-4">
                      {order.items.map(item => (
                         <div key={item.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                           <div className="flex items-center gap-4">
                             <img src={item.imageUrl} className="w-12 h-12 object-cover rounded bg-slate-100" alt="" />
                             <div>
                               <div className="text-sm font-medium text-slate-900">{item.name}</div>
                               <div className="text-xs text-slate-500">Qty: {item.quantity}</div>
                             </div>
                           </div>
                           <div className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</div>
                         </div>
                      ))}
                      {order.cancellationReason && (
                          <div className="mt-4 p-3 bg-red-50 text-red-800 text-sm rounded border border-red-100">
                              <span className="font-bold">Cancellation Reason:</span> {order.cancellationReason}
                          </div>
                      )}
                    </div>
                    <div className="bg-slate-50 p-4 border-t border-slate-200 text-right">
                      <span className="text-slate-600 mr-2">Total:</span>
                      <span className="text-lg font-bold text-slate-900">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

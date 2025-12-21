
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getOrders, updateOrderStatus, deleteOrder, cancelOrder, formatCurrency } from '../services/db';
import { Order } from '../types';
import { Package, Truck, CheckCircle, ChevronDown, ChevronUp, Trash2, XCircle } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const refresh = async () => {
      const allOrders = await getOrders();
      setOrders([...allOrders].reverse()); // Newest first
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    await updateOrderStatus(id, newStatus);
    refresh();
  };

  const handleCancelOrder = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      const reason = window.prompt("Reason for cancellation (optional):");
      if (reason !== null) {
          await cancelOrder(id, reason);
          refresh();
      }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      await deleteOrder(id);
      refresh();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Order Management</h2>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                <th className="p-4 text-slate-600 font-semibold">Order ID</th>
                <th className="p-4 text-slate-600 font-semibold">Customer</th>
                <th className="p-4 text-slate-600 font-semibold">Date</th>
                <th className="p-4 text-slate-600 font-semibold">Total</th>
                <th className="p-4 text-slate-600 font-semibold">Status</th>
                <th className="p-4 text-slate-600 font-semibold text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">No orders found.</td>
                </tr>
                ) : (
                orders.map(order => (
                    <React.Fragment key={order.id}>
                    <tr className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => toggleExpand(order.id)}>
                        <td className="p-4 font-medium text-blue-600">#{order.id}</td>
                        <td className="p-4">
                        <div className="font-medium text-slate-900">{order.shippingDetails.fullName}</div>
                        <div className="text-xs text-slate-500">{order.shippingDetails.email}</div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                        {new Date(order.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                        {formatCurrency(order.total)}
                        </td>
                        <td className="p-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                        </span>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                            {order.status !== 'Cancelled' && (
                                <button
                                    type="button"
                                    onClick={(e) => handleCancelOrder(e, order.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Cancel Order"
                                >
                                    <XCircle size={18} />
                                </button>
                            )}
                            <button 
                            type="button"
                            onClick={(e) => handleDelete(e, order.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete Order"
                            >
                            <Trash2 size={18} />
                            </button>
                            <button className="text-slate-400 hover:text-slate-600 p-2">
                            {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                        </div>
                        </td>
                    </tr>
                    
                    {expandedOrder === order.id && (
                        <tr className="bg-slate-50 cursor-default">
                        <td colSpan={6} className="p-6 border-b border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Order Details */}
                            <div>
                                <h4 className="font-bold text-slate-900 mb-4">Order Items</h4>
                                <div className="space-y-3">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex gap-4 bg-white p-3 rounded border border-slate-200">
                                    <img src={item.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
                                    <div>
                                        <div className="font-medium text-sm">{item.name}</div>
                                        <div className="text-xs text-slate-500">Qty: {item.quantity} × {formatCurrency(item.price)}</div>
                                    </div>
                                    </div>
                                ))}
                                </div>
                                {order.cancellationReason && (
                                    <div className="mt-4 bg-red-50 p-3 rounded border border-red-200 text-sm text-red-700">
                                        <span className="font-bold">Cancellation Reason:</span> {order.cancellationReason}
                                    </div>
                                )}
                            </div>

                            {/* Status & Shipping */}
                            <div className="space-y-6">
                                <div>
                                <h4 className="font-bold text-slate-900 mb-2">Update Status</h4>
                                <div className="flex gap-2 flex-wrap">
                                    <button disabled={order.status === 'Cancelled'} onClick={() => handleStatusChange(order.id, 'Processing')} className={`px-3 py-1 rounded border text-sm transition-colors ${order.status === 'Processing' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white hover:bg-slate-100'}`}>Processing</button>
                                    <button disabled={order.status === 'Cancelled'} onClick={() => handleStatusChange(order.id, 'Shipped')} className={`px-3 py-1 rounded border text-sm transition-colors ${order.status === 'Shipped' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white hover:bg-slate-100'}`}>Shipped</button>
                                    <button disabled={order.status === 'Cancelled'} onClick={() => handleStatusChange(order.id, 'Delivered')} className={`px-3 py-1 rounded border text-sm transition-colors ${order.status === 'Delivered' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white hover:bg-slate-100'}`}>Delivered</button>
                                </div>
                                {order.status === 'Cancelled' && <p className="text-xs text-red-600 mt-2 font-medium">This order has been cancelled and cannot be updated.</p>}
                                </div>

                                <div>
                                <h4 className="font-bold text-slate-900 mb-2">Shipping Address</h4>
                                <div className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-200 shadow-sm">
                                    <p className="font-medium text-slate-900 mb-1">{order.shippingDetails.fullName}</p>
                                    <p>{order.shippingDetails.address}</p>
                                    <p>{order.shippingDetails.city}, {order.shippingDetails.state} {order.shippingDetails.zipCode}</p>
                                    <p>{order.shippingDetails.country}</p>
                                    <p className="mt-2 text-slate-900 flex items-center gap-2"><span className="font-semibold">Phone:</span> <a href={`tel:${order.shippingDetails.phone}`} className="text-blue-600 hover:underline">{order.shippingDetails.phone}</a></p>
                                    <p className="text-slate-900 flex items-center gap-2"><span className="font-semibold">Email:</span> <a href={`mailto:${order.shippingDetails.email}`} className="text-blue-600 hover:underline">{order.shippingDetails.email}</a></p>
                                </div>
                                </div>
                            </div>
                            </div>
                        </td>
                        </tr>
                    )}
                    </React.Fragment>
                ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </AdminLayout>
  );
};

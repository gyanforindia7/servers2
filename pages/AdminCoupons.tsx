
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getCoupons, saveCoupon, deleteCoupon, formatCurrency } from '../services/db';
import { Coupon } from '../types';
import { Ticket, Plus, Trash2, Edit, Save, X, ArrowRight } from '../components/Icons';

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  
  const initialForm: Coupon = {
    id: '',
    code: '',
    type: 'percentage',
    value: 0,
    minOrderValue: 0,
    isActive: true
  };
  const [formData, setFormData] = useState<Coupon>(initialForm);

  const refresh = () => setCoupons(getCoupons());
  useEffect(() => { refresh(); }, []);

  const handleEdit = (coupon: Coupon) => {
    setFormData(coupon);
    setView('form');
  };

  const handleCreate = () => {
    setFormData({ ...initialForm, id: `c-${Date.now()}` });
    setView('form');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCoupon(formData);
    setView('list');
    refresh();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('Delete this coupon?')) {
      deleteCoupon(id);
      refresh();
    }
  };

  return (
    <AdminLayout>
      {view === 'list' ? (
        <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Coupon Management</h2>
            <button onClick={handleCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700">
              <Plus size={20} /> Create Coupon
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                    <th className="p-4 font-semibold text-slate-600">Code</th>
                    <th className="p-4 font-semibold text-slate-600">Discount</th>
                    <th className="p-4 font-semibold text-slate-600">Min Order</th>
                    <th className="p-4 font-semibold text-slate-600">Status</th>
                    <th className="p-4 font-semibold text-slate-600 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-blue-600">{c.code}</td>
                        <td className="p-4">
                        {c.type === 'percentage' ? `${c.value}% Off` : `${formatCurrency(c.value)} Off`}
                        </td>
                        <td className="p-4 text-slate-500">
                        {c.minOrderValue ? formatCurrency(c.minOrderValue) : '-'}
                        </td>
                        <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                            <button type="button" onClick={(e) => handleDelete(c.id, e)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <button onClick={() => setView('list')} className="text-slate-500 hover:text-slate-800"><ArrowRight className="rotate-180" size={24} /></button>
               <h3 className="text-xl font-bold">{formData.id ? 'Edit Coupon' : 'New Coupon'}</h3>
            </div>
          </div>
          <div className="p-8 max-w-2xl">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Coupon Code</label>
                  <input required type="text" className="w-full p-3 border rounded-lg uppercase font-mono" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="SUMMER2024" />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Status</label>
                   <select className="w-full p-3 border rounded-lg bg-white" value={formData.isActive ? 'active' : 'inactive'} onChange={e => setFormData({...formData, isActive: e.target.value === 'active'})}>
                     <option value="active">Active</option>
                     <option value="inactive">Inactive</option>
                   </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <select className="w-full p-3 border rounded-lg bg-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (INR)</option>
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">Value</label>
                   <input required type="number" className="w-full p-3 border rounded-lg" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium mb-1">Minimum Order Value (Optional)</label>
                 <input type="number" className="w-full p-3 border rounded-lg" value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})} placeholder="0" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700">
                  <Save size={18} /> Save Coupon
                </button>
                <button type="button" onClick={() => setView('list')} className="text-slate-600 px-6 py-3 hover:bg-slate-100 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

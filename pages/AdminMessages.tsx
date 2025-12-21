
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getContactMessages, markMessageRead, deleteMessage } from '../services/db';
import { ContactMessage } from '../types';
import { Mail, CheckCircle, Circle, Trash2 } from 'lucide-react';

export const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const refresh = async () => {
      const msgs = await getContactMessages();
      setMessages([...msgs].reverse());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRead = async (id: string) => {
    await markMessageRead(id);
    refresh();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('Delete this message?')) {
      await deleteMessage(id);
      refresh();
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Inbox (Contact Us)</h2>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {messages.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No messages found.</div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`p-6 hover:bg-slate-50 transition-colors group relative min-w-[300px] ${msg.status === 'New' ? 'bg-blue-50/50' : ''}`}>
                 <button 
                    onClick={(e) => handleDelete(msg.id, e)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Delete Message"
                 >
                    <Trash2 size={18} />
                 </button>

                 <div className="flex justify-between items-start mb-2 pr-8">
                   <div className="flex items-center gap-3">
                     {msg.status === 'New' ? (
                       <Circle size={12} className="text-blue-600 fill-blue-600" />
                     ) : (
                       <CheckCircle size={16} className="text-slate-400" />
                     )}
                     <span className="font-bold text-slate-900">{msg.firstName} {msg.lastName}</span>
                     <span className="text-xs text-slate-400">{new Date(msg.date).toLocaleString()}</span>
                   </div>
                   {msg.status === 'New' && (
                     <button onClick={() => handleRead(msg.id)} className="text-xs font-semibold text-blue-600 hover:underline mr-8">Mark as Read</button>
                   )}
                 </div>
                 
                 <div className="ml-6">
                    <div className="text-sm font-semibold text-slate-800 mb-1">{msg.subject}</div>
                    <div className="text-xs text-slate-500 mb-3">
                       {msg.email} {msg.phone && `• ${msg.phone}`}
                    </div>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

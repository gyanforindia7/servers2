
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getQuotes, updateQuoteStatus, deleteQuote } from '../services/db';
import { QuoteRequest } from '../types';
import { FileText, CheckCircle, Clock, Trash2 } from 'lucide-react';

export const AdminQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);

  const refresh = async () => {
      const q = await getQuotes();
      setQuotes([...q].reverse());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleStatusToggle = async (id: string, currentStatus: QuoteRequest['status']) => {
    const newStatus = currentStatus === 'Pending' ? 'Processed' : 'Pending';
    await updateQuoteStatus(id, newStatus);
    refresh();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('Delete this quote request?')) {
      await deleteQuote(id);
      refresh();
    }
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Quote Requests</h2>

      <div className="grid grid-cols-1 gap-4">
        {quotes.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-slate-200 text-slate-500">
            No quote requests found.
          </div>
        ) : (
          quotes.map(quote => (
            <div key={quote.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-6 relative group">
              <button 
                onClick={(e) => handleDelete(quote.id, e)}
                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                title="Delete Quote"
              >
                <Trash2 size={18} />
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${quote.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {quote.status}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(quote.date).toLocaleString()}</span>
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg">{quote.customerName}</h3>
                <div className="text-slate-600 text-sm mb-4">
                  <a href={`mailto:${quote.customerEmail}`} className="text-blue-600 hover:underline">{quote.customerEmail}</a>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                   <h4 className="font-semibold text-sm mb-2 text-slate-700">Requested Products:</h4>
                   {quote.products.map((p, idx) => (
                     <div key={idx} className="flex justify-between text-sm">
                       <span>{p.productName}</span>
                       <span className="font-bold">x{p.quantity}</span>
                     </div>
                   ))}
                   {quote.products.length === 0 && <span className="text-sm italic text-slate-400">General Inquiry</span>}

                   {quote.message && (
                     <div className="mt-4 pt-4 border-t border-slate-200">
                       <h4 className="font-semibold text-sm mb-1 text-slate-700">Message:</h4>
                       <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.message}</p>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex items-start">
                 <button 
                  onClick={() => handleStatusToggle(quote.id, quote.status)}
                  className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors ${
                    quote.status === 'Pending' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                 >
                   {quote.status === 'Pending' ? 'Mark Processed' : 'Mark Pending'}
                 </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
};

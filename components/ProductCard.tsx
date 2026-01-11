
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
// Fix: Destructure from namespace import with any cast to resolve environment export issues
const { Link } = ReactRouterDOM as any;
import { Product } from '../types';
import { ShoppingCart, FileText } from './Icons';
import { formatCurrency } from '../services/db';
import { useApp } from '../App';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, openQuoteModal } = useApp();
  const showBuy = product.allowDirectBuy ?? (product.category === 'Laptops');
  const topSpecs = Object.entries(product.specs).slice(0, 3);

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (showBuy) {
      addToCart(product, 1);
    } else {
      openQuoteModal({ id: product.id, name: product.name, quantity: 1 });
    }
  };

  const isDisabled = product.isActive === false;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-full group relative ${isDisabled ? 'opacity-60 grayscale' : ''}`}>
      <Link to={`/product/${product.slug}`} className="block relative aspect-[5/4] bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700" 
        />
        {/* Condition Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg text-white ${product.condition === 'New' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
          {product.condition}
        </div>
        
        {showBuy && !isDisabled && (
          <div className="absolute top-3 right-3 bg-teal-500 text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-lg">
            Ready to Buy
          </div>
        )}
      </Link>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
           <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest truncate">{product.brand}</div>
           <div className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 font-mono">{product.sku}</div>
        </div>
        
        <Link to={`/product/${product.slug}`}>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm md:text-base mb-3 leading-tight line-clamp-2 group-hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Specs Grid */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-4 space-y-2 text-[11px] md:text-xs border border-slate-100 dark:border-slate-700">
          {topSpecs.map(([key, value]) => (
            <div key={key} className="flex justify-between items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium truncate shrink-0">{key}</span>
              <span className="text-slate-900 dark:text-slate-200 truncate font-bold text-right" title={value}>{value}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {!showBuy && <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Inquiry price</span>}
            <span className="text-base md:text-lg font-bold text-slate-900 dark:text-white block truncate leading-none">
              {formatCurrency(product.price)}
            </span>
          </div>
          
          <button 
            onClick={handleAction}
            disabled={isDisabled}
            className={`p-3 rounded-xl transition-all shadow-lg ${
              showBuy 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20' 
              : 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 shadow-slate-900/20'
            } ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
            title={showBuy ? 'Add to Cart' : 'Request Quote'}
          >
            {showBuy ? <ShoppingCart size={20} /> : <FileText size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

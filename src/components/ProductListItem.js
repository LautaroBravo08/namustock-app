import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { roundUpToMultiple, formatNumber } from '../utils/helpers';

const ProductListItem = ({ product, addToCart, themeType, roundingMultiple, allowDecimals }) => {
  const { isGlowActive, animationDelay } = useRandomGlow(themeType === 'dark');

  return (
    <div 
      className={`bg-[var(--color-bg-secondary)] rounded-lg shadow-md p-3 flex items-center gap-3 hover:shadow-xl transition-shadow duration-300 border border-[var(--color-border)] ${isGlowActive ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}
      style={{ '--animation-delay': animationDelay }}
    >
      <img 
        className="w-16 h-16 object-cover rounded-md flex-shrink-0" 
        src={product.imageUrls[0] || 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'} 
        alt={product.name} 
        onError={(e) => { 
          e.target.onerror = null; 
          e.target.src='https://placehold.co/200x200/cccccc/ffffff?text=Error'; 
        }}
      />
      
      <div className="flex-grow min-w-0">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] truncate mb-1">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? product.stock : '0'}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {product.stock > 0 ? 'unidades' : 'agotado'}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] animate-gradient-x">
              ${formatNumber(roundUpToMultiple(product.price, roundingMultiple), allowDecimals)}
            </p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => addToCart(product)} 
        disabled={product.stock === 0} 
        className="flex-shrink-0 bg-[var(--color-primary)] text-[var(--color-primary-text)] p-2.5 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ProductListItem;
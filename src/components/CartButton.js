import React from 'react';
import { ShoppingCart } from 'lucide-react';

const CartButton = ({ itemCount, onClick }) => (
  <button 
    onClick={onClick} 
    className="fixed bottom-6 left-6 bg-[var(--color-primary)] text-[var(--color-primary-text)] w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200 z-40"
  >
    <ShoppingCart className="h-7 w-7" />
    {itemCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
        {itemCount}
      </span>
    )}
  </button>
);

export default CartButton;
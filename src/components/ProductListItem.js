import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { roundToMultiple, formatNumber } from '../utils/helpers';
import { getProductImage } from '../firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';

const ProductListItem = ({ product, addToCart, themeType, roundingMultiple, roundingDirection, allowDecimals, imageUrl, onProductClick }) => {
  const { isGlowActive, animationDelay } = useRandomGlow(themeType === 'dark');
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0 || isAddingToCart) return;

    setIsAddingToCart(true);

    // Vibración usando navigator.vibrate (más compatible)
    try {
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
    } catch (error) {
      console.log('Vibration not available:', error);
    }

    // Agregar al carrito
    addToCart(product);

    // Resetear estado después de la animación
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 600);
  };

  return (
    <div
      className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-[var(--color-border)] ${isGlowActive ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''} overflow-hidden`}
      style={{ '--animation-delay': animationDelay }}
    >
      <div className="flex items-center gap-4 sm:gap-6 pl-4 sm:pl-6">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex-shrink-0 flex items-center justify-center cursor-pointer"
          onClick={() => onProductClick(product)}
        >
          <img
            className="w-full h-full object-cover shadow-md rounded-lg"
            src={imageUrl || 'https://placehold.co/200x200/cccccc/ffffff?text=No+Image'}
            alt={product.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/200x200/cccccc/ffffff?text=Error';
            }}
          />
        </div>

        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`flex-grow min-w-0 relative overflow-hidden group p-4 sm:p-6 ${product.stock === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            } ${isAddingToCart ? 'animate-pulse scale-95' : 'hover:scale-[1.01]'} 
          transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-50`}
          style={{ touchAction: 'manipulation' }}
        >
          {/* Fondo interactivo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/3 to-[var(--color-primary)]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>

          {/* Contenido del botón */}
          <div className="relative z-10 flex flex-col justify-center text-left">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--color-text-primary)] break-words leading-tight mb-1 overflow-hidden group-hover:text-[var(--color-primary)] transition-colors duration-300">
              {product.name}
            </h3>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className={`text-sm sm:text-base font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `${product.stock}` : 'Agotado'}
                </span>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] animate-gradient-x">
                  ${formatNumber(roundToMultiple(product.price, roundingMultiple, roundingDirection), allowDecimals)}
                </p>
              </div>

              {/* Indicador visual sutil */}
              <div className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                <ShoppingCart className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
            </div>
          </div>

          {/* Efecto de ondas al hacer click */}
          {isAddingToCart && (
            <div className="absolute inset-0 bg-[var(--color-primary)]/20 animate-ping rounded-lg"></div>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductListItem;
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { roundToMultiple, formatNumber } from '../utils/helpers';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const ProductCard = ({ product, addToCart, cardStyle, roundingMultiple, roundingDirection, allowDecimals, imageUrls, onProductClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const cardRef = useRef(null);
  
  // Hook de visibilidad para optimizar animaciones
  const { elementRef: visibilityRef, isVisible, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });
  
  const displayPrice = roundToMultiple(product.price, roundingMultiple, roundingDirection);

  const validImageUrls = useMemo(() => imageUrls || [], [imageUrls]);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % validImageUrls.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prevIndex) => 
      (prevIndex - 1 + validImageUrls.length) % validImageUrls.length
    );
  };

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
      ref={visibilityRef}
      className={`product-card-wrapper`}
    >
      <div 
        ref={cardRef}
        className={`product-card-container ${!isVisible && hasBeenVisible ? 'opacity-50' : ''}`}
        data-style={cardStyle}
      >
                  <div className="product-card-inner" onClick={() => onProductClick(product)}>          <div className="product-card-front">
            <div className="relative group/image">
              <img 
                className="product-card-image" 
                src={validImageUrls[currentImageIndex] || 'https://placehold.co/400x400/cccccc/ffffff?text=No+Image'} 
                alt={product.name} 
                onError={(e) => { 
                  e.target.onerror = null; 
                  e.target.src='https://placehold.co/400x400/cccccc/ffffff?text=Error'; 
                }} 
              />
              
              {/* Stock en la esquina inferior de la imagen */}
              <div className="absolute bottom-2 left-2">
                <span className={`px-2 py-1 rounded-md text-xs font-bold shadow-lg ${product.stock > 0 ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                  {product.stock > 0 ? `${product.stock}` : 'Agotado'}
                </span>
              </div>
              
              {validImageUrls.length > 1 && (
                <div className="absolute inset-0 flex justify-between items-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={prevImage} 
                    className="bg-black/30 text-white p-2 rounded-full ml-2 hover:bg-black/50"
                  >
                    <ArrowLeft size={16}/>
                  </button>
                  <button 
                    onClick={nextImage} 
                    className="bg-black/30 text-white p-2 rounded-full mr-2 hover:bg-black/50"
                  >
                    <ArrowRight size={16}/>
                  </button>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`product-card-info-button w-full relative overflow-hidden group ${
                product.stock === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              } 
              transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-50`}
              style={{ touchAction: 'manipulation' }}
            >
              {/* Fondo interactivo sutil */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/3 to-[var(--color-primary)]/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
              
              {/* Contenido del botón */}
              <div class="relative z-10 p-2 sm:p-3 text-left">
                <div class="product-card-header mb-2">
                  <h3 class="product-card-title text-base sm:text-lg md:text-xl font-bold leading-tight break-words group-hover:text-[var(--color-primary)] transition-colors duration-300 line-clamp-2">
                    {product.name}
                  </h3>
                </div>
                
                <div className="product-card-footer flex items-center justify-between gap-2">
                  <p className="text-xl sm:text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] leading-tight">
                    ${formatNumber(displayPrice, allowDecimals)}
                  </p>
                  
                  {/* Indicador visual sutil */}
                  <div className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--color-primary)]" />
                  </div>
                </div>
              </div>
              
              {/* Efecto de ondas al hacer click */}
              {isAddingToCart && (
                <div className="absolute inset-0 bg-[var(--color-primary)]/20 rounded-lg"></div>
              )}
            </button>
          </div>
          
          <div className="product-card-back">
            <h3 className="product-card-title">{product.name}</h3>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)]">
              ${formatNumber(displayPrice, allowDecimals)}
            </p>
            <button 
              onClick={(e) => handleAddToCart(e)} 
              disabled={product.stock === 0} 
              className="w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-1.5 px-3 rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-primary-hover)] transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              {product.stock > 0 ? 'Carrito' : 'Agotado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
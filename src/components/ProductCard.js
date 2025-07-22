import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { roundUpToMultiple, formatNumber } from '../utils/helpers';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const ProductCard = ({ product, addToCart, cardStyle, roundingMultiple, allowDecimals }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const cardRef = useRef(null);
  
  // Hook de visibilidad para optimizar animaciones
  const { elementRef: visibilityRef, isVisible, hasBeenVisible } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });
  
  const displayPrice = roundUpToMultiple(product.price, roundingMultiple);
  const validImageUrls = useMemo(() => 
    product.imageUrls.filter(url => url), [product.imageUrls]
  );

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

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [cardStyle]);

  useEffect(() => {
    if (!cardRef.current || !isVisible) return; // Solo agregar listeners si es visible
    
    const currentCardRef = cardRef.current;
    
    const handleMouseMove = (e) => {
      // Solo procesar mouse move si la tarjeta es visible
      if (!isVisible) return;
      
      const rect = currentCardRef.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;

      if (cardStyle === 'crystal-3d') {
        currentCardRef.style.setProperty('--rotate-x', `${rotateX}deg`);
        currentCardRef.style.setProperty('--rotate-y', `${rotateY}deg`);
      }

      if (cardStyle === 'spotlight-hover') {
        currentCardRef.style.setProperty('--mouse-x', `${x}px`);
        currentCardRef.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    const handleMouseLeave = () => {
      if (cardStyle === 'crystal-3d') {
        currentCardRef.style.setProperty('--rotate-x', `0deg`);
        currentCardRef.style.setProperty('--rotate-y', `0deg`);
      }
    }

    currentCardRef.addEventListener('mousemove', handleMouseMove);
    currentCardRef.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      currentCardRef.removeEventListener('mousemove', handleMouseMove);
      currentCardRef.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cardStyle, isVisible]);

  return (
    <div 
      ref={visibilityRef}
      className={`product-card-wrapper ${isAnimating ? 'animate-card-change' : ''}`}
    >
      <div 
        ref={cardRef}
        className={`product-card-container ${!isVisible && hasBeenVisible ? 'opacity-50' : ''}`}
        data-style={cardStyle}
      >
        <div className="product-card-inner">
          <div className="product-card-front">
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
            
            <div className="product-card-info">
              <div className="product-card-header">
                <h3 className="product-card-title">{product.name}</h3>
                <p className="product-card-price">
                  ${formatNumber(displayPrice, allowDecimals)}
                </p>
              </div>
              
              <div className="product-card-footer">
                <div className="product-card-stock-container">
                  <span className={`product-card-stock-number ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {product.stock > 0 ? product.stock : '0'}
                  </span>
                  <span className="product-card-stock-label">
                    {product.stock > 0 ? 'unidades' : 'agotado'}
                  </span>
                </div>
                
                <button 
                  onClick={() => addToCart(product)} 
                  disabled={product.stock === 0} 
                  className="product-card-add-button"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="product-card-back">
            <h3 className="product-card-title">{product.name}</h3>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] animate-gradient-x">
              ${formatNumber(displayPrice, allowDecimals)}
            </p>
            <button 
              onClick={() => addToCart(product)} 
              disabled={product.stock === 0} 
              className="w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-primary-hover)] transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-5 w-5" />
              {product.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
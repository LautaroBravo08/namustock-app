import React from 'react';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { roundUpToMultiple, formatNumber } from '../utils/helpers';

const CartModal = ({ 
  isOpen, 
  onClose, 
  cartItems, 
  updateCartQuantity, 
  removeFromCart, 
  handleCheckout, 
  themeType, 
  roundingMultiple, 
  allowDecimals 
}) => {
  const { isGlowActive } = useRandomGlow(isOpen && themeType === 'dark');
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const total = roundUpToMultiple(
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), 
    roundingMultiple
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4 transition-opacity duration-300">
      <div
        className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-out border border-[var(--color-border)] ${isGlowActive ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}
      >
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Carrito de Compras</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-center text-[var(--color-text-secondary)] py-10">El carrito está vacío</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img 
                      src={item.imageUrls[0]} 
                      alt={item.name} 
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-[var(--color-text-primary)]">{item.name}</h3>
                      <p className="text-[var(--color-text-secondary)] text-sm">
                        ${formatNumber(item.price, allowDecimals)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-[var(--color-border)] rounded-md">
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)} 
                        className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
                      >
                        <Minus className="h-4 w-4"/>
                      </button>
                      <span className="px-3 font-semibold text-[var(--color-text-primary)]">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)} 
                        disabled={item.quantity >= item.stock} 
                        className="p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] disabled:text-gray-300"
                      >
                        <Plus className="h-4 w-4"/>
                      </button>
                    </div>
                    
                    <p className="font-bold w-20 text-right text-[var(--color-text-primary)]">
                      ${formatNumber(item.price * item.quantity, allowDecimals)}
                    </p>
                    
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-bg)] rounded-b-xl">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-medium text-[var(--color-text-secondary)]">Total</span>
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] animate-gradient-x">
              ${formatNumber(total, allowDecimals)}
            </span>
          </div>
          <button 
            onClick={handleCheckout} 
            disabled={cartItems.length === 0} 
            className="w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-3 rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Proceder al Pago
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartModal;